// Kambrium Story Engine Designer JS

// --- Asset Manager System ---
let assetStore = {
    loaded: false,
    folderName: "",
    backgrounds: [],     // Array of { name: "cave", ext: "png", objectUrl: null }
    sprites: {},         // { "grug": ["neutral", "happy"], "una": ["angry", "happy", "neutral"] }
    spriteUrls: {},      // { "grug_neutral": objectUrl, ... }
    audio: {
        bgm: [],         // Array of { name: "theme", ext: "ogg", path: "audio/bgm/theme.ogg" }
        sfx: []          // Array of { name: "shake", ext: "wav", path: "audio/sfx/shake.wav" }
    },
    bgUrls: {}           // { "cave": objectUrl, ... }
};

const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".bmp"];
const AUDIO_EXTENSIONS = [".ogg", ".mp3", ".wav", ".flac", ".aac"];

// --- IndexedDB Storage for FileSystemDirectoryHandle ---
const DB_NAME = "KambriumAssetsDB";
const STORE_NAME = "handles";
const KEY_NAME = "assetsFolder";

function getDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            db.createObjectStore(STORE_NAME);
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
}

async function saveDirectoryHandle(handle) {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).put(handle, KEY_NAME);
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Failed to save directory handle to IndexedDB:", e);
    }
}

async function loadDirectoryHandle() {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, "readonly");
        const request = tx.objectStore(STORE_NAME).get(KEY_NAME);
        return new Promise((resolve, reject) => {
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    } catch (e) {
        console.error("Failed to load directory handle from IndexedDB:", e);
        return null;
    }
}

async function clearDirectoryHandle() {
    try {
        const db = await getDB();
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(KEY_NAME);
        await new Promise((resolve, reject) => {
            tx.oncomplete = resolve;
            tx.onerror = () => reject(tx.error);
        });
    } catch (e) {
        console.error("Failed to clear directory handle from IndexedDB:", e);
    }
}

function initAssetManager() {
    const selectBtn = document.getElementById("btn-select-assets");
    const clearBtn = document.getElementById("btn-clear-assets");
    const fallbackInput = document.getElementById("fallback-dir-input");

    // Create reactivate button dynamically if it does not exist
    let reactivateBtn = document.getElementById("btn-reactivate-assets");
    if (!reactivateBtn && selectBtn) {
        reactivateBtn = document.createElement("button");
        reactivateBtn.id = "btn-reactivate-assets";
        reactivateBtn.className = "btn btn-success btn-sm asset-folder-btn";
        reactivateBtn.textContent = "🔄 Ordner laden";
        reactivateBtn.style.display = "none";
        reactivateBtn.style.marginRight = "6px"; // Add small spacing
        selectBtn.parentNode.insertBefore(reactivateBtn, selectBtn);
    }

    selectBtn.addEventListener("click", async () => {
        if (window.showDirectoryPicker) {
            try {
                const dirHandle = await window.showDirectoryPicker({ mode: "read" });
                await saveDirectoryHandle(dirHandle);
                await scanDirectoryHandle(dirHandle);
            } catch (e) {
                if (e.name !== "AbortError") {
                    console.error("Directory picker error:", e);
                    showToast("❌ Fehler beim Öffnen des Ordners.");
                }
            }
        } else {
            // Fallback for browsers without File System Access API
            fallbackInput.click();
        }
    });

    if (reactivateBtn) {
        reactivateBtn.addEventListener("click", async () => {
            const savedHandle = await loadDirectoryHandle();
            if (savedHandle) {
                try {
                    const status = await savedHandle.requestPermission({ mode: "read" });
                    if (status === "granted") {
                        await scanDirectoryHandle(savedHandle);
                    } else {
                        showToast("⚠️ Zugriff wurde nicht erlaubt.");
                    }
                } catch (e) {
                    console.error("Error requesting permission:", e);
                    showToast("❌ Fehler beim Reaktivieren des Zugriffs.");
                }
            }
        });
    }

    fallbackInput.addEventListener("change", (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;
        scanFileList(files);
    });

    clearBtn.addEventListener("click", () => {
        clearAssetStore();
        showToast("Asset-Cache geleert.");
    });

    // Restore cached asset index from localStorage
    restoreAssetIndex();

    // Check if we can automatically load or need to show the reactivate button
    tryAutoLoadDirectory();
}

async function scanDirectoryHandle(dirHandle) {
    resetAssetStore();
    assetStore.folderName = dirHandle.name;

    async function scanDir(handle, pathPrefix) {
        for await (const entry of handle.values()) {
            const entryPath = pathPrefix ? pathPrefix + "/" + entry.name : entry.name;
            if (entry.kind === "directory") {
                await scanDir(entry, entryPath);
            } else if (entry.kind === "file") {
                await processFileEntry(entryPath, entry.name, async () => {
                    const file = await entry.getFile();
                    return URL.createObjectURL(file);
                });
            }
        }
    }

    await scanDir(dirHandle, "");
    finalizeAssetLoad();
}

function scanFileList(files) {
    resetAssetStore();

    // Detect folder name from webkitRelativePath
    if (files.length > 0 && files[0].webkitRelativePath) {
        const firstPath = files[0].webkitRelativePath;
        assetStore.folderName = firstPath.split("/")[0];
    } else {
        assetStore.folderName = "assets";
    }

    const promises = files.map(file => {
        // webkitRelativePath gives e.g. "assets/backgrounds/cave.png"
        let relativePath = file.webkitRelativePath || file.name;
        // Remove the root folder name prefix
        const parts = relativePath.split("/");
        if (parts.length > 1) {
            relativePath = parts.slice(1).join("/");
        }
        return processFileEntry(relativePath, file.name, () => {
            return URL.createObjectURL(file);
        });
    });

    Promise.all(promises).then(() => {
        finalizeAssetLoad();
    });
}

async function processFileEntry(relativePath, fileName, createObjectUrl) {
    const lowerName = fileName.toLowerCase();
    const ext = "." + lowerName.split(".").pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf("."));
    const lowerPath = relativePath.toLowerCase();

    // Backgrounds: files directly in backgrounds/
    if (lowerPath.startsWith("backgrounds/") && IMAGE_EXTENSIONS.includes(ext)) {
        const pathParts = relativePath.split("/");
        if (pathParts.length === 2) { // Direct child of backgrounds/
            const url = await createObjectUrl();
            assetStore.backgrounds.push({ name: nameWithoutExt, ext: ext.substring(1), objectUrl: url });
            assetStore.bgUrls[nameWithoutExt] = url;
        }
    }
    // Sprites: files in sprites/ with format {character}_{emotion}.ext
    else if (lowerPath.startsWith("sprites/") && IMAGE_EXTENSIONS.includes(ext)) {
        const pathParts = relativePath.split("/");
        if (pathParts.length === 2) { // Direct child of sprites/
            const underscoreIdx = nameWithoutExt.indexOf("_");
            if (underscoreIdx > 0) {
                const charId = nameWithoutExt.substring(0, underscoreIdx).toLowerCase();
                const emotion = nameWithoutExt.substring(underscoreIdx + 1).toLowerCase();
                if (!assetStore.sprites[charId]) assetStore.sprites[charId] = [];
                if (!assetStore.sprites[charId].includes(emotion)) {
                    assetStore.sprites[charId].push(emotion);
                }
                const url = await createObjectUrl();
                assetStore.spriteUrls[nameWithoutExt.toLowerCase()] = url;
            }
        }
    }
    // Audio BGM: files in audio/bgm/
    else if (lowerPath.startsWith("audio/bgm/") && AUDIO_EXTENSIONS.includes(ext)) {
        assetStore.audio.bgm.push({ name: nameWithoutExt, ext: ext.substring(1), path: relativePath });
    }
    // Audio SFX: files in audio/sfx/
    else if (lowerPath.startsWith("audio/sfx/") && AUDIO_EXTENSIONS.includes(ext)) {
        assetStore.audio.sfx.push({ name: nameWithoutExt, ext: ext.substring(1), path: relativePath });
    }
}

function resetAssetStore() {
    // Revoke old object URLs to prevent memory leaks
    Object.values(assetStore.bgUrls).forEach(url => { try { URL.revokeObjectURL(url); } catch (e) { } });
    Object.values(assetStore.spriteUrls).forEach(url => { try { URL.revokeObjectURL(url); } catch (e) { } });

    assetStore.loaded = false;
    assetStore.folderName = "";
    assetStore.backgrounds = [];
    assetStore.sprites = {};
    assetStore.spriteUrls = {};
    assetStore.audio = { bgm: [], sfx: [] };
    assetStore.bgUrls = {};
}

async function clearAssetStore() {
    resetAssetStore();
    localStorage.removeItem("kambrium_asset_index");
    localStorage.removeItem("kambrium_asset_folder_name");
    await clearDirectoryHandle();

    const reactivateBtn = document.getElementById("btn-reactivate-assets");
    const selectBtn = document.getElementById("btn-select-assets");
    if (reactivateBtn) reactivateBtn.style.display = "none";
    if (selectBtn) selectBtn.textContent = "📂 Ordner wählen";

    updateAssetStatusUI();
    renderCommands();
}

function finalizeAssetLoad() {
    assetStore.loaded = true;
    // Sort backgrounds alphabetically
    assetStore.backgrounds.sort((a, b) => a.name.localeCompare(b.name));
    assetStore.audio.bgm.sort((a, b) => a.name.localeCompare(b.name));
    assetStore.audio.sfx.sort((a, b) => a.name.localeCompare(b.name));
    // Sort sprite emotions
    Object.keys(assetStore.sprites).forEach(charId => {
        assetStore.sprites[charId].sort();
    });

    saveAssetIndex();
    updateAssetStatusUI();
    renderCommands(); // Refresh command editors with new options

    // Hide reactivate button and update select button text since we successfully loaded
    const reactivateBtn = document.getElementById("btn-reactivate-assets");
    const selectBtn = document.getElementById("btn-select-assets");
    if (reactivateBtn) reactivateBtn.style.display = "none";
    if (selectBtn) selectBtn.textContent = "📂 Anderer Ordner";

    const totalAssets = assetStore.backgrounds.length +
        Object.values(assetStore.sprites).reduce((sum, arr) => sum + arr.length, 0) +
        assetStore.audio.bgm.length + assetStore.audio.sfx.length;
    showToast(`✅ ${totalAssets} Assets aus "${assetStore.folderName}" geladen!`);
}

function saveAssetIndex() {
    try {
        const index = {
            backgrounds: assetStore.backgrounds.map(b => ({ name: b.name, ext: b.ext })),
            sprites: assetStore.sprites,
            audio: {
                bgm: assetStore.audio.bgm.map(a => ({ name: a.name, ext: a.ext, path: a.path })),
                sfx: assetStore.audio.sfx.map(a => ({ name: a.name, ext: a.ext, path: a.path }))
            }
        };
        localStorage.setItem("kambrium_asset_index", JSON.stringify(index));
        localStorage.setItem("kambrium_asset_folder_name", assetStore.folderName);
    } catch (e) {
        console.error("Failed to save asset index to localStorage:", e);
    }
}

function restoreAssetIndex() {
    const indexStr = localStorage.getItem("kambrium_asset_index");
    const folderName = localStorage.getItem("kambrium_asset_folder_name");
    if (indexStr && folderName) {
        try {
            const index = JSON.parse(indexStr);
            assetStore.folderName = folderName;
            assetStore.backgrounds = (index.backgrounds || []).map(b => ({ ...b, objectUrl: null }));
            assetStore.sprites = index.sprites || {};
            assetStore.audio = {
                bgm: index.audio?.bgm || [],
                sfx: index.audio?.sfx || []
            };
            // Mark as loaded (without images — those need the folder to be re-selected)
            assetStore.loaded = true;
            updateAssetStatusUI(true); // partial = cached index only
        } catch (e) {
            console.error("Failed to restore asset index:", e);
        }
    } else {
        updateAssetStatusUI();
    }
}

function updateAssetStatusUI(isCachedOnly) {
    const statusEl = document.getElementById("asset-status");
    const detailsEl = document.getElementById("asset-details");
    const clearBtn = document.getElementById("btn-clear-assets");

    if (assetStore.loaded) {
        statusEl.className = "asset-status loaded";
        statusEl.querySelector(".asset-status-icon").textContent = isCachedOnly ? "🔄" : "✅";
        const hint = isCachedOnly ? " (Cache — Klicke 'Ordner laden' für Vorschau)" : "";
        statusEl.querySelector(".asset-status-text").textContent = assetStore.folderName + hint;

        document.getElementById("asset-count-bg").textContent = assetStore.backgrounds.length;
        document.getElementById("asset-count-sprites").textContent =
            Object.values(assetStore.sprites).reduce((sum, arr) => sum + arr.length, 0);
        document.getElementById("asset-count-bgm").textContent = assetStore.audio.bgm.length;
        document.getElementById("asset-count-sfx").textContent = assetStore.audio.sfx.length;

        detailsEl.style.display = "flex";
        clearBtn.style.display = "inline-flex";
    } else {
        statusEl.className = "asset-status";
        statusEl.querySelector(".asset-status-icon").textContent = "⚠️";
        statusEl.querySelector(".asset-status-text").textContent = "Kein Ordner gewählt";
        detailsEl.style.display = "none";
        clearBtn.style.display = "none";
    }
}

async function tryAutoLoadDirectory() {
    if (!window.showDirectoryPicker) return;

    const savedHandle = await loadDirectoryHandle();
    const selectBtn = document.getElementById("btn-select-assets");
    const reactivateBtn = document.getElementById("btn-reactivate-assets");

    if (savedHandle) {
        try {
            const status = await savedHandle.queryPermission({ mode: "read" });
            if (status === "granted") {
                await scanDirectoryHandle(savedHandle);
                if (reactivateBtn) reactivateBtn.style.display = "none";
                if (selectBtn) selectBtn.textContent = "📂 Anderer Ordner";
            } else {
                if (reactivateBtn) reactivateBtn.style.display = "inline-flex";
                if (selectBtn) selectBtn.textContent = "📂 Anderer Ordner";
            }
        } catch (e) {
            console.error("Error checking directory permission:", e);
        }
    } else {
        if (reactivateBtn) reactivateBtn.style.display = "none";
        if (selectBtn) selectBtn.textContent = "📂 Ordner wählen";
    }
}

// --- Core Data Structures ---
let project = {
    start_scene: "Prolog",
    characters: [
        { id: "grug", name: "Grug" },
        { id: "una", name: "Una" },
        { id: "flint", name: "Flint" }
    ],
    variables: {
        flags: ["cave_explored", "una_met", "grug_happy"],
        numbers: {
            trilobite_shells_count: 0
        }
    },
    scenes: {
        "Prolog": [] // Will be populated in init/demo
    }
};

// --- Active Editor State ---
let currentSceneId = "Prolog";
let currentTab = "script";
let currentSubTab = "flags";
let expandedNodes = {};

// --- 2D Node Graph Canvas State ---
let panX = 100;
let panY = 100;
let zoom = 1.0;
let isPanning = false;
let isDraggingNode = false;
let draggedNodeIdx = -1;
let dragNodeStartX = 0;
let dragNodeStartY = 0;
let hasDraggedNode = false;
let isConnecting = false;
let connectionStart = null; // { idx, optIdx, type, x, y }

function updateTransform() {
    const container = document.getElementById("script-graph-transform-container");
    if (container) {
        container.style.transform = `translate(${panX}px, ${panY}px) scale(${zoom})`;
    }
}

function generateUniqueId() {
    return "cmd_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
}

function ensureNodeIdsAndResolveConnections(proj) {
    if (!proj || !proj.scenes) return;

    // Step 1: Filter out implicit jump commands and reconstruct next_id / next_disconnected
    for (const sceneId in proj.scenes) {
        const cmds = proj.scenes[sceneId];
        if (!Array.isArray(cmds)) continue;

        const cleanedCmds = [];
        for (let i = 0; i < cmds.length; i++) {
            const cmd = cmds[i];
            if (cmd.type === "Jump" && cmd.implicit) {
                if (cleanedCmds.length > 0) {
                    const prevCmd = cleanedCmds[cleanedCmds.length - 1];
                    if (cmd.target_id === "END_OF_SCENE") {
                        prevCmd.next_disconnected = true;
                        prevCmd.next_id = null;
                    } else {
                        prevCmd.next_id = cmd.target_id;
                        prevCmd.next_disconnected = false;
                    }
                }
            } else {
                cleanedCmds.push(cmd);
            }
        }
        proj.scenes[sceneId] = cleanedCmds;
    }

    // Step 2: Ensure every command in every scene has a unique ID
    for (const sceneId in proj.scenes) {
        const cmds = proj.scenes[sceneId];
        if (!Array.isArray(cmds)) continue;
        cmds.forEach((cmd) => {
            if (!cmd.id) {
                cmd.id = generateUniqueId();
            }
        });
    }

    // Step 3: Resolve target_index to target_id for Jump, Choice, and Branch commands
    for (const sceneId in proj.scenes) {
        const cmds = proj.scenes[sceneId];
        if (!Array.isArray(cmds)) continue;

        cmds.forEach((cmd) => {
            if (cmd.type === "Jump") {
                if (!cmd.target_id) {
                    const targetScene = cmd.target_scene || sceneId;
                    const targetSceneCmds = proj.scenes[targetScene];
                    if (targetSceneCmds && targetSceneCmds[cmd.target_index]) {
                        cmd.target_id = targetSceneCmds[cmd.target_index].id;
                    }
                }
            } else if (cmd.type === "Choice" && cmd.options) {
                cmd.options.forEach((opt) => {
                    if (!opt.target_id) {
                        const targetScene = opt.target_scene || sceneId;
                        const targetSceneCmds = proj.scenes[targetScene];
                        if (targetSceneCmds && targetSceneCmds[opt.target_index]) {
                            opt.target_id = targetSceneCmds[opt.target_index].id;
                        }
                    }
                });
            } else if (cmd.type === "Branch" && cmd.branches) {
                cmd.branches.forEach((branch) => {
                    if (!branch.target_id) {
                        const targetScene = branch.target_scene || sceneId;
                        const targetSceneCmds = proj.scenes[targetScene];
                        if (targetSceneCmds && targetSceneCmds[branch.target_index]) {
                            branch.target_id = targetSceneCmds[branch.target_index].id;
                        }
                    }
                });
            }
        });
    }
}

function resolveCommandIndex(sceneId, targetId, defaultIdx = 0) {
    if (!targetId) return defaultIdx;
    const sceneCmds = project.scenes[sceneId];
    if (!sceneCmds) return defaultIdx;
    const idx = sceneCmds.findIndex(c => c.id === targetId);
    return idx !== -1 ? idx : defaultIdx;
}

function prepareProjectForExport(proj) {
    const exported = JSON.parse(JSON.stringify(proj));
    const finalScenes = {};

    // Pass 1: Build the finalCmds array for each scene, inserting implicit Jumps
    for (const sceneId in exported.scenes) {
        const originalCmds = exported.scenes[sceneId];
        const finalCmds = [];

        for (let i = 0; i < originalCmds.length; i++) {
            const cmd = originalCmds[i];
            finalCmds.push(cmd);

            if (cmd.type !== "Choice" && cmd.type !== "Branch" && cmd.type !== "Jump") {
                const nextNodeInArray = originalCmds[i + 1];
                if (cmd.next_disconnected) {
                    finalCmds.push({
                        type: "Jump",
                        target_scene: null,
                        target_id: "END_OF_SCENE",
                        conditions: [],
                        implicit: true
                    });
                } else if (cmd.next_id) {
                    if (!nextNodeInArray || nextNodeInArray.id !== cmd.next_id) {
                        finalCmds.push({
                            type: "Jump",
                            target_scene: null,
                            target_id: cmd.next_id,
                            conditions: [],
                            implicit: true
                        });
                    }
                }
            }
        }
        finalScenes[sceneId] = finalCmds;
    }

    // Build map of ID -> Index in finalCmds for each scene
    const idToIdxMap = {};
    for (const sId in finalScenes) {
        idToIdxMap[sId] = {};
        finalScenes[sId].forEach((c, idx) => {
            if (c.id) {
                idToIdxMap[sId][c.id] = idx;
            }
        });
    }

    // Pass 2: Resolve all target_index values using target_id
    for (const sceneId in finalScenes) {
        const cmds = finalScenes[sceneId];

        cmds.forEach((c) => {
            if (c.type === "Jump") {
                if (c.target_id === "END_OF_SCENE") {
                    c.target_index = cmds.length;
                } else {
                    const targetScene = c.target_scene || sceneId;
                    const map = idToIdxMap[targetScene];
                    if (map && c.target_id && map[c.target_id] !== undefined) {
                        c.target_index = map[c.target_id];
                    } else {
                        if (c.target_index === undefined) c.target_index = 0;
                    }
                }
            } else if (c.type === "Choice" && c.options) {
                c.options.forEach((opt) => {
                    const targetScene = opt.target_scene || sceneId;
                    const map = idToIdxMap[targetScene];
                    if (map && opt.target_id && map[opt.target_id] !== undefined) {
                        opt.target_index = map[opt.target_id];
                    } else {
                        if (opt.target_index === undefined) opt.target_index = 0;
                    }
                });
            } else if (c.type === "Branch" && c.branches) {
                c.branches.forEach((branch) => {
                    const targetScene = branch.target_scene || sceneId;
                    const map = idToIdxMap[targetScene];
                    if (map && branch.target_id && map[branch.target_id] !== undefined) {
                        branch.target_index = map[branch.target_id];
                    } else {
                        if (branch.target_index === undefined) branch.target_index = 0;
                    }
                });
            }
        });
    }

    exported.scenes = finalScenes;
    return exported;
}

function saveToLocalStorage() {
    try {
        localStorage.setItem("kambrium_dating_sim_project", JSON.stringify(project));
    } catch (e) {
        console.error("Auto-save to localStorage failed:", e);
    }
}

let currentBgmAudio = null;

function stopAllPtAudio() {
    if (currentBgmAudio) {
        currentBgmAudio.pause();
        currentBgmAudio = null;
    }
}

// --- Playtester Live State ---
let ptState = {
    active: false,
    currentSceneId: "",
    currentIndex: 0,
    shownCharacters: [], // Array of { id, position, emotion }
    variables: {}, // Live flag and numeric values
    affection: {}, // Live character affections
    log: [],
    typingInterval: null,
    isFastForward: false,
    player_name: "Spieler",
    player_pronoun: "Er"
};

// --- Initialisation ---
document.addEventListener("DOMContentLoaded", () => {
    initAssetManager();
    initTabs();
    initSubTabs();
    initProjectActions();
    initVariablesManager();
    initScenesManager();
    initCommandEditor();
    initPlaytestControls();
    initKeyboardShortcuts();
    initSidebarToggle();

    // Load from localStorage or fallback to default demo project
    const stored = localStorage.getItem("kambrium_dating_sim_project");
    if (stored) {
        try {
            project = JSON.parse(stored);
            // Ensure structural fallback properties
            if (!project.characters) project.characters = [];
            if (!project.variables) project.variables = {};
            if (!project.variables.flags) project.variables.flags = [];
            if (!project.variables.numbers) project.variables.numbers = {};
            if (!project.player_variables) {
                project.player_variables = { name: "Spieler", pronoun: "Er" };
            }

            ensureNodeIdsAndResolveConnections(project);

            // Set currentSceneId to first available scene
            const scenes = Object.keys(project.scenes);
            currentSceneId = scenes.length > 0 ? scenes[0] : "";

            // Show toast feedback
            setTimeout(() => {
                showToast("Projekt aus Browserspeicher geladen!");
            }, 100);
        } catch (e) {
            console.error("Failed to parse project from localStorage, loading demo:", e);
            loadDemoProject();
            ensureNodeIdsAndResolveConnections(project);
        }
    } else {
        loadDemoProject();
        ensureNodeIdsAndResolveConnections(project);
    }

    // Initial UI Sync
    syncAllUI();

    // Resize listener to redraw script graph edges dynamically
    window.addEventListener("resize", () => {
        if (currentTab === "script") {
            drawScriptGraphEdges();
        }
    });
});

// --- Tab Switching Navigation ---
function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const target = btn.getAttribute("data-tab");
            document.getElementById(`tab-${target}`).classList.add("active");
            currentTab = target;

            if (target === "graph") {
                stopAllPtAudio();
                renderSceneGraph();
            } else if (target === "playtest") {
                initPlaytester();
            } else if (target === "script") {
                stopAllPtAudio();
                setTimeout(() => {
                    drawScriptGraphEdges();
                }, 50);
            }
        });
    });
}

function initSubTabs() {
    const subtabs = document.querySelectorAll(".sub-tab-btn");
    subtabs.forEach(btn => {
        btn.addEventListener("click", () => {
            subtabs.forEach(t => t.classList.remove("active"));
            document.querySelectorAll(".sub-tab-content").forEach(c => c.classList.remove("active"));

            btn.classList.add("active");
            const target = btn.getAttribute("data-subtab");
            document.getElementById(`subtab-${target}`).classList.add("active");
            currentSubTab = target;
        });
    });
}

// --- Project Import/Export Actions ---
function initProjectActions() {
    document.getElementById("btn-new-project").addEventListener("click", () => {
        if (confirm("Möchtest du wirklich ein neues Projekt erstellen? Alle ungesicherten Änderungen gehen verloren.")) {
            project = {
                start_scene: "",
                characters: [],
                variables: { flags: [], numbers: {} },
                player_variables: { name: "Spieler", pronoun: "Er" },
                scenes: {}
            };
            currentSceneId = "";
            syncAllUI();
            saveToLocalStorage();
        }
    });

    document.getElementById("btn-load-demo").addEventListener("click", () => {
        if (confirm("Demo-Projekt laden? Aktuelle ungespeicherte Daten werden überschrieben.")) {
            loadDemoProject();
            ensureNodeIdsAndResolveConnections(project);
            syncAllUI();
            saveToLocalStorage();
        }
    });

    document.getElementById("btn-export").addEventListener("click", () => {
        const prepared = prepareProjectForExport(project);
        const jsonStr = JSON.stringify(prepared, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "story.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    document.getElementById("file-import").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const parsed = JSON.parse(evt.target.result);
                if (parsed.scenes && parsed.variables) {
                    project = parsed;
                    // Ensure structural fallback properties
                    if (!project.characters) project.characters = [];
                    if (!project.variables.flags) project.variables.flags = [];
                    if (!project.variables.numbers) project.variables.numbers = {};
                    if (!project.player_variables) {
                        project.player_variables = { name: "Spieler", pronoun: "Er" };
                    }

                    ensureNodeIdsAndResolveConnections(project);

                    const sceneKeys = Object.keys(project.scenes);
                    currentSceneId = sceneKeys.length > 0 ? sceneKeys[0] : "";
                    syncAllUI();
                    saveToLocalStorage();
                    alert("Story-Projekt erfolgreich importiert!");
                } else {
                    alert("Fehler: Ungültiges Kambrium-Projektformat (Szenen oder Variablen fehlen).");
                }
            } catch (err) {
                alert("Fehler beim Parsen der JSON-Datei: " + err.message);
            }
        };
        reader.readAsText(file);
    });
}

// --- Variables, Flags, Characters UI Manager ---
function initVariablesManager() {
    // Add Flag
    document.getElementById("btn-add-flag").addEventListener("click", () => {
        const input = document.getElementById("input-new-flag");
        const name = input.value.trim().toLowerCase();
        if (name && !project.variables.flags.includes(name)) {
            project.variables.flags.push(name);
            input.value = "";
            renderFlagsList();
        }
    });

    // Add Number Var
    document.getElementById("btn-add-num").addEventListener("click", () => {
        const nameInput = document.getElementById("input-new-num");
        const valInput = document.getElementById("input-new-num-val");
        const name = nameInput.value.trim().toLowerCase();
        const val = parseInt(valInput.value) || 0;
        if (name && !(name in project.variables.numbers)) {
            project.variables.numbers[name] = val;
            nameInput.value = "";
            valInput.value = "0";
            renderNumbersList();
        }
    });

    // Add Character
    document.getElementById("btn-add-char").addEventListener("click", () => {
        const idInput = document.getElementById("input-new-char-id");
        const nameInput = document.getElementById("input-new-char-name");
        const id = idInput.value.trim().toLowerCase();
        const name = nameInput.value.trim();
        if (id && name && !project.characters.find(c => c.id === id)) {
            project.characters.push({ id, name });
            idInput.value = "";
            nameInput.value = "";
            renderCharactersList();
            // Refresh character selection dropdowns in command editor
            renderCommands();
        }
    });

    // Enter key support for all sidebar inputs
    document.getElementById("input-new-flag").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("btn-add-flag").click();
    });
    document.getElementById("input-new-num").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("btn-add-num").click();
    });
    document.getElementById("input-new-num-val").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("btn-add-num").click();
    });
    document.getElementById("input-new-char-id").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("input-new-char-name").focus();
    });
    document.getElementById("input-new-char-name").addEventListener("keydown", (e) => {
        if (e.key === "Enter") document.getElementById("btn-add-char").click();
    });
}

function renderFlagsList() {
    const list = document.getElementById("flags-list");
    list.innerHTML = "";
    project.variables.flags.forEach(flag => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="var-name">${flag}</span>
            <div class="var-details">
                <span class="var-meta">Flag (Bool)</span>
                <button class="btn-icon text-danger" onclick="deleteFlag('${flag}')">×</button>
            </div>
        `;
        list.appendChild(li);
    });
    saveToLocalStorage();
}

window.deleteFlag = function (flagName) {
    project.variables.flags = project.variables.flags.filter(f => f !== flagName);
    renderFlagsList();
};

function renderNumbersList() {
    const list = document.getElementById("numbers-list");
    list.innerHTML = "";
    Object.keys(project.variables.numbers).forEach(name => {
        const val = project.variables.numbers[name];
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="var-name">${name}</span>
            <div class="var-details">
                <input type="number" class="input-number" style="width: 55px; padding: 2px 4px;" value="${val}" onchange="updateNumberVar('${name}', this.value)">
                <button class="btn-icon text-danger" onclick="deleteNumberVar('${name}')">×</button>
            </div>
        `;
        list.appendChild(li);
    });
    saveToLocalStorage();
}

window.updateNumberVar = function (name, val) {
    project.variables.numbers[name] = parseInt(val) || 0;
    saveToLocalStorage();
};

window.deleteNumberVar = function (name) {
    delete project.variables.numbers[name];
    renderNumbersList();
};

function renderCharactersList() {
    const list = document.getElementById("characters-list");
    list.innerHTML = "";
    project.characters.forEach(char => {
        const li = document.createElement("li");
        li.innerHTML = `
            <span class="var-name">${char.name} (${char.id})</span>
            <div class="var-details">
                <span class="var-meta">Affection</span>
                <button class="btn-icon text-danger" onclick="deleteCharacter('${char.id}')">×</button>
            </div>
        `;
        list.appendChild(li);
    });
    saveToLocalStorage();
}

window.deleteCharacter = function (id) {
    project.characters = project.characters.filter(c => c.id !== id);
    renderCharactersList();
    renderCommands();
};

// --- Scenes UI Manager ---
function initScenesManager() {
    document.getElementById("btn-add-scene").addEventListener("click", () => {
        const name = prompt("Name der neuen Szene:");
        if (name && name.trim()) {
            const cleanName = name.trim();
            if (cleanName in project.scenes) {
                alert("Eine Szene mit diesem Namen existiert bereits.");
                return;
            }
            project.scenes[cleanName] = [];
            currentSceneId = cleanName;

            if (!project.start_scene) {
                project.start_scene = cleanName;
            }

            syncScenesList();
            syncStartSceneSelector();
            selectScene(cleanName);
        }
    });

    document.getElementById("input-scene-name").addEventListener("change", (e) => {
        const newName = e.target.value.trim();
        if (!newName || newName === currentSceneId) return;

        if (newName in project.scenes) {
            alert("Fehler: Name existiert bereits.");
            e.target.value = currentSceneId;
            return;
        }

        // Rename scene key in projects
        project.scenes[newName] = project.scenes[currentSceneId];
        delete project.scenes[currentSceneId];

        // Fix target scene jumps in other commands
        Object.values(project.scenes).forEach(cmds => {
            cmds.forEach(cmd => {
                if (cmd.type === "Jump" || cmd.type === "JumpToScene") {
                    if (cmd.target_scene === currentSceneId) cmd.target_scene = newName;
                } else if (cmd.type === "Choice") {
                    cmd.options.forEach(opt => {
                        if (opt.target_scene === currentSceneId) opt.target_scene = newName;
                    });
                } else if (cmd.type === "Branch") {
                    cmd.branches?.forEach(branch => {
                        if (branch.target_scene === currentSceneId) branch.target_scene = newName;
                    });
                }
            });
        });

        if (project.start_scene === currentSceneId) {
            project.start_scene = newName;
        }

        currentSceneId = newName;
        syncScenesList();
        syncStartSceneSelector();
        selectScene(newName);
    });

    document.getElementById("btn-delete-scene").addEventListener("click", () => {
        if (confirm(`Szene "${currentSceneId}" wirklich löschen?`)) {
            delete project.scenes[currentSceneId];
            const keys = Object.keys(project.scenes);
            currentSceneId = keys.length > 0 ? keys[0] : "";

            if (project.start_scene && !(project.start_scene in project.scenes)) {
                project.start_scene = currentSceneId;
            }

            syncScenesList();
            syncStartSceneSelector();
            selectScene(currentSceneId);
        }
    });

    document.getElementById("select-start-scene").addEventListener("change", (e) => {
        project.start_scene = e.target.value;
        saveToLocalStorage();
    });
}

function syncScenesList() {
    const list = document.getElementById("scenes-list");
    list.innerHTML = "";
    Object.keys(project.scenes).forEach(sceneId => {
        const li = document.createElement("li");
        if (sceneId === currentSceneId) li.classList.add("active");

        li.innerHTML = `
            <span>${sceneId}</span>
            ${sceneId === project.start_scene ? '<span class="cmd-badge" style="background:#554; color:#eb6;">START</span>' : ''}
        `;
        li.addEventListener("click", () => selectScene(sceneId));
        list.appendChild(li);
    });
    saveToLocalStorage();
}

function syncStartSceneSelector() {
    const select = document.getElementById("select-start-scene");
    select.innerHTML = "";
    Object.keys(project.scenes).forEach(sceneId => {
        const opt = document.createElement("option");
        opt.value = sceneId;
        opt.textContent = sceneId;
        if (sceneId === project.start_scene) opt.selected = true;
        select.appendChild(opt);
    });
}

function selectScene(sceneId) {
    currentSceneId = sceneId;
    syncScenesList();

    const emptyState = document.getElementById("editor-empty-state");
    const editorHeader = document.querySelector(".scene-editor-header");
    const commandsWorkspace = document.querySelector(".commands-workspace");

    if (sceneId) {
        document.getElementById("input-scene-name").value = sceneId;
        document.getElementById("lbl-scene-id").textContent = `ID: ${sceneId}`;
        if (emptyState) emptyState.style.display = "none";
        if (editorHeader) editorHeader.style.display = "flex";
        if (commandsWorkspace) commandsWorkspace.style.display = "flex";
        renderCommands();

        // Auto-center canvas on the node graph
        setTimeout(() => {
            const canvas = document.getElementById("commands-list-container");
            if (canvas) {
                panX = Math.round(canvas.offsetWidth / 2 - 4840 - 190);
                panY = Math.round(canvas.offsetHeight / 2 - 4500 - 100);
                zoom = 1.0;
                updateTransform();
                drawScriptGraphEdges();
            }
        }, 80);
    } else {
        document.getElementById("input-scene-name").value = "";
        document.getElementById("lbl-scene-id").textContent = "Keine Szene gewählt";
        document.getElementById("commands-list-container").innerHTML = "";
        if (emptyState) emptyState.style.display = "flex";
        if (editorHeader) editorHeader.style.display = "none";
        if (commandsWorkspace) commandsWorkspace.style.display = "none";
    }
}

// --- Command List & Editor ---
function initCommandEditor() {
    document.getElementById("btn-add-command").addEventListener("click", () => {
        if (!currentSceneId) return;
        const type = document.getElementById("select-new-cmd-type").value;
        const defaultCmd = createDefaultCommand(type);

        // Auto-position new node diagonally (staircase style) to the right and down
        const cmds = project.scenes[currentSceneId];
        let lastY = 4500;
        let lastX = 4840;
        if (cmds.length > 0) {
            const lastCmd = cmds[cmds.length - 1];
            if (lastCmd.graph_x !== undefined) lastX = lastCmd.graph_x + 480;
            if (lastCmd.graph_y !== undefined) lastY = lastCmd.graph_y + 120;
        }
        defaultCmd.graph_x = lastX;
        defaultCmd.graph_y = lastY;

        cmds.push(defaultCmd);
        renderCommands();
    });

    const canvas = document.getElementById("commands-list-container");
    if (!canvas) return;

    // Pan canvas
    canvas.addEventListener("mousedown", (e) => {
        if (e.target.closest(".script-node") || e.target.closest("button") || e.target.closest("select") || e.target.closest("input") || e.target.closest("textarea")) {
            return;
        }
        isPanning = true;
        canvas.style.cursor = "grabbing";
        startPanX = e.clientX - panX;
        startPanY = e.clientY - panY;
    });

    window.addEventListener("mousemove", (e) => {
        if (isPanning) {
            panX = e.clientX - startPanX;
            panY = e.clientY - startPanY;
            updateTransform();
        }

        if (isDraggingNode && draggedNodeIdx !== -1) {
            const cmds = project.scenes[currentSceneId];
            if (cmds && cmds[draggedNodeIdx]) {
                hasDraggedNode = true;
                const cmd = cmds[draggedNodeIdx];
                let graphX = e.clientX / zoom - dragNodeStartX;
                let graphY = e.clientY / zoom - dragNodeStartY;

                // Clamp to positive space with margin (min 50px) to prevent negative clipping
                graphX = Math.max(50, graphX);
                graphY = Math.max(50, graphY);

                cmd.graph_x = Math.round(graphX);
                cmd.graph_y = Math.round(graphY);

                const nodeEl = document.querySelector(`.script-node[data-index="${draggedNodeIdx}"]`);
                if (nodeEl) {
                    nodeEl.style.left = cmd.graph_x + "px";
                    nodeEl.style.top = cmd.graph_y + "px";
                }
                drawScriptGraphEdges();
            }
        }

        if (isConnecting && connectionStart) {
            const dragLine = document.getElementById("drag-connection-line");
            if (dragLine) {
                const canvasRect = canvas.getBoundingClientRect();
                const mouseX = ((e.clientX - canvasRect.left) - panX) / zoom;
                const mouseY = ((e.clientY - canvasRect.top) - panY) / zoom;

                const fromX = connectionStart.x;
                const fromY = connectionStart.y;
                const dx = Math.abs(mouseX - fromX) * 0.5;
                const pathD = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${mouseX - dx} ${mouseY}, ${mouseX} ${mouseY}`;
                dragLine.setAttribute("d", pathD);
            }
        }
    });

    window.addEventListener("mouseup", (e) => {
        if (isPanning) {
            isPanning = false;
            canvas.style.cursor = "grab";
        }

        if (isDraggingNode) {
            isDraggingNode = false;
            draggedNodeIdx = -1;
            saveToLocalStorage();
        }

        if (isConnecting && connectionStart) {
            const dragLine = document.getElementById("drag-connection-line");
            if (dragLine) dragLine.style.display = "none";

            const targetPort = e.target.closest(".port-dot.execution-in");
            if (targetPort) {
                const targetIdx = parseInt(targetPort.getAttribute("data-port-in"));
                if (!isNaN(targetIdx) && targetIdx !== connectionStart.idx) {
                    createGraphConnection(connectionStart.idx, targetIdx, connectionStart.optIdx, connectionStart.type);
                }
            }
            isConnecting = false;
            connectionStart = null;
        }
    });

    // Zoom canvas
    canvas.addEventListener("wheel", (e) => {
        e.preventDefault();
        const zoomFactor = 1.08;
        const canvasRect = canvas.getBoundingClientRect();

        const mouseX = (e.clientX - canvasRect.left - panX) / zoom;
        const mouseY = (e.clientY - canvasRect.top - panY) / zoom;

        if (e.deltaY < 0) {
            zoom = Math.min(2.0, zoom * zoomFactor);
        } else {
            zoom = Math.max(0.2, zoom / zoomFactor);
        }

        panX = e.clientX - canvasRect.left - mouseX * zoom;
        panY = e.clientY - canvasRect.top - mouseY * zoom;

        updateTransform();
    });
}

function createDefaultCommand(type) {
    let cmd;
    switch (type) {
        case "Say":
            cmd = { type: "Say", character: "", text: "", conditions: [] };
            break;
        case "Show":
            cmd = { type: "Show", character: "", position: "Center", emotion: "neutral", conditions: [] };
            break;
        case "Hide":
            cmd = { type: "Hide", character: "" };
            break;
        case "Background":
            cmd = { type: "Background", asset: assetStore.backgrounds.length > 0 ? assetStore.backgrounds[0].name : "" };
            break;
        case "Choice":
            cmd = { type: "Choice", options: [{ text: "Antwort...", target_scene: null, target_index: 0, effects: [], conditions: [] }] };
            break;
        case "ModifyVariables":
            cmd = { type: "ModifyVariables", effects: [] };
            break;
        case "Branch":
            cmd = { type: "Branch", branches: [{ target_scene: null, target_index: 0, conditions: [] }] };
            break;
        case "Jump":
            cmd = { type: "Jump", target_scene: null, target_index: 0, conditions: [] };
            break;
        case "PlayBgm":
            cmd = { type: "PlayBgm", path: assetStore.audio.bgm.length > 0 ? assetStore.audio.bgm[0].path : "" };
            break;
        case "PlaySfx":
            cmd = { type: "PlaySfx", path: assetStore.audio.sfx.length > 0 ? assetStore.audio.sfx[0].path : "" };
            break;
        case "StopBgm":
            cmd = { type: "StopBgm" };
            break;
        case "ShakeWindow":
            cmd = { type: "ShakeWindow", intensity: 10.0, duration_ms: 400 };
            break;
        case "GlitchText":
            cmd = { type: "GlitchText", duration: 1.0 };
            break;
        case "FakeError":
            cmd = { type: "FakeError", title: "Fatal Error", message: "Grug.chr wurde unerwartet beendet." };
            break;
        default:
            cmd = { type: "Say", character: "", text: "" };
            break;
    }
    cmd.id = generateUniqueId();
    return cmd;
}

function getCommandBadgeClass(type) {
    switch (type) {
        case "Say": return "cmd-badge-dialog";
        case "Show":
        case "Hide":
        case "Background": return "cmd-badge-scene";
        case "PlayBgm":
        case "PlaySfx":
        case "StopBgm": return "cmd-badge-audio";
        case "ShakeWindow":
        case "GlitchText":
        case "FakeError": return "cmd-badge-subversion";
        case "Jump":
        case "Choice":
        case "Branch": return "cmd-badge-logic";
        case "ModifyVariables": return "cmd-badge-variable";
        default: return "";
    }
}

function renderCommands() {
    const nodesContainer = document.getElementById("script-nodes-container");
    if (!nodesContainer) {
        const container = document.getElementById("commands-list-container");
        if (container) container.innerHTML = "";
        return;
    }

    nodesContainer.innerHTML = "";
    if (!currentSceneId || !project.scenes[currentSceneId]) {
        drawScriptGraphEdges();
        return;
    }

    const cmds = project.scenes[currentSceneId];
    cmds.forEach((cmd, idx) => {
        const node = document.createElement("div");
        const isExpanded = expandedNodes[currentSceneId + "_" + idx];
        node.className = "script-node" + (isExpanded ? " expanded" : "");
        node.setAttribute("data-index", idx);

        // Position absolutely in 2D space (staircase pattern)
        if (cmd.graph_x === undefined || cmd.graph_y === undefined) {
            cmd.graph_x = 4840 + idx * 480;
            cmd.graph_y = 4500 + idx * 120;
        }
        node.style.left = cmd.graph_x + "px";
        node.style.top = cmd.graph_y + "px";

        const badgeClass = getCommandBadgeClass(cmd.type);
        const preview = getNodePreviewText(cmd);

        node.innerHTML = `
            <div class="command-card-header script-node-header" onclick="toggleNodeExpansion(${idx}, event)">
                <div class="command-card-title">
                    <span class="node-toggle-icon">▶</span>
                    <span class="cmd-index">#${idx}</span>
                    <span class="cmd-badge ${badgeClass}">${cmd.type}</span>
                    <span class="node-preview-text" id="node-preview-${idx}">${escapeHtml(preview)}</span>
                </div>
                <div class="command-card-actions" onclick="event.stopPropagation()">
                    ${idx === 0
                ? `<span class="badge badge-success" style="font-size: 11px; padding: 2px 6px; background-color: var(--color-primary); color: white; border-radius: 4px; font-weight: bold; margin-right: 4px;">Root 🚩</span>`
                : `<button class="btn btn-secondary btn-sm" style="margin-right: 4px;" onclick="setRootCommand(${idx})">Set Root</button>`
            }
                    <button class="btn btn-secondary btn-sm" style="margin-right: 4px;" onclick="playtestFromCommand(${idx})" title="Playtest von hier starten">🕹️ Testen</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCommand(${idx})">×</button>
                </div>
            </div>
            <div class="script-node-ports">
                <div class="port-container in">
                    <div class="port-dot execution-in" data-port-in="${idx}"></div>
                    In
                </div>
                ${cmd.type === "Choice" ? `
                    <div class="port-container out choice-collapsed-port">
                        Optionen
                        <div class="port-dot choice-port" data-port-choice-collapsed-out="${idx}"></div>
                    </div>
                ` : cmd.type === "Branch" ? `
                    <div class="port-container out branch-collapsed-port">
                        Zweige
                        <div class="port-dot branch-port" data-port-branch-collapsed-out="${idx}"></div>
                    </div>
                ` : `
                    <div class="port-container out">
                        Out
                        <div class="port-dot ${cmd.type === 'Jump' ? 'jump-port' : 'execution-out'}" ${cmd.type === 'Jump' ? `data-port-jump-out="${idx}"` : `data-port-out="${idx}"`}></div>
                    </div>
                `}
            </div>
            <div class="command-card-body script-node-body">
                ${renderCommandFields(cmd, idx)}
            </div>
        `;
        nodesContainer.appendChild(node);

        // Add dragging hook-up for the node header
        const headerEl = node.querySelector(".script-node-header");
        headerEl.addEventListener("mousedown", (e) => {
            if (e.target.closest("button") || e.target.closest("input") || e.target.closest("select") || e.target.closest("textarea")) {
                return;
            }
            e.preventDefault();
            isDraggingNode = true;
            draggedNodeIdx = idx;
            hasDraggedNode = false;
            dragNodeStartX = e.clientX / zoom - cmd.graph_x;
            dragNodeStartY = e.clientY / zoom - cmd.graph_y;

            // Bring node to front
            document.querySelectorAll(".script-node").forEach(n => n.style.zIndex = 10);
            node.style.zIndex = 100;
        });
    });

    // Add port event handlers for starting connections
    const ports = document.querySelectorAll(".port-dot");
    ports.forEach(port => {
        port.addEventListener("mousedown", (e) => {
            e.stopPropagation();
            e.preventDefault();

            const outIdx = parseInt(port.getAttribute("data-port-out"));
            const choiceOut = port.getAttribute("data-port-choice-out");
            const choiceCollapsedOut = port.getAttribute("data-port-choice-collapsed-out");
            const branchOut = port.getAttribute("data-port-branch-out");
            const branchCollapsedOut = port.getAttribute("data-port-branch-collapsed-out");
            const jumpOut = parseInt(port.getAttribute("data-port-jump-out"));

            let idx, optIdx, type;

            if (!isNaN(outIdx)) {
                idx = outIdx;
                type = "normal";
            } else if (choiceOut) {
                const parts = choiceOut.split("-");
                idx = parseInt(parts[0]);
                optIdx = parseInt(parts[1]);
                type = "choice";
            } else if (choiceCollapsedOut) {
                idx = parseInt(choiceCollapsedOut);
                optIdx = 0; // Default to first option
                type = "choice";
            } else if (branchOut) {
                const parts = branchOut.split("-");
                idx = parseInt(parts[0]);
                optIdx = parseInt(parts[1]);
                type = "branch";
            } else if (branchCollapsedOut) {
                idx = parseInt(branchCollapsedOut);
                optIdx = 0;
                type = "branch";
            } else if (!isNaN(jumpOut)) {
                idx = jumpOut;
                type = "jump";
            } else {
                return; // Input port
            }

            const canvas = document.getElementById("commands-list-container");
            const canvasRect = canvas.getBoundingClientRect();
            const portRect = port.getBoundingClientRect();
            const pX = ((portRect.left + portRect.width / 2 - canvasRect.left) - panX) / zoom;
            const pY = ((portRect.top + portRect.height / 2 - canvasRect.top) - panY) / zoom;

            isConnecting = true;
            connectionStart = { idx, optIdx, type, x: pX, y: pY };

            const dragLine = document.getElementById("drag-connection-line");
            if (dragLine) {
                dragLine.style.display = "block";
                dragLine.setAttribute("d", `M ${pX} ${pY} L ${pX} ${pY}`);
            }
        });
    });

    saveToLocalStorage();

    // Draw connections/edges after rendering the nodes
    setTimeout(() => {
        drawScriptGraphEdges();
    }, 50);
}

window.toggleNodeExpansion = function (idx, event) {
    if (hasDraggedNode) {
        hasDraggedNode = false;
        return;
    }
    const key = currentSceneId + "_" + idx;
    expandedNodes[key] = !expandedNodes[key];

    const nodeEl = document.querySelector(`.script-node[data-index="${idx}"]`);
    if (nodeEl) {
        nodeEl.classList.toggle("expanded", !!expandedNodes[key]);
    }

    // Redraw edges because layout heights changed
    setTimeout(() => {
        drawScriptGraphEdges();
    }, 50);
};

function getNodePreviewText(cmd) {
    if (!cmd) return "";
    switch (cmd.type) {
        case "Say":
            const previewTxt = getPreviewText(cmd.text);
            return cmd.character ? `${cmd.character}: "${previewTxt}"` : `"${previewTxt}"`;
        case "Show":
            return `${cmd.character} (${cmd.emotion || 'neutral'}) bei ${cmd.position || 'Center'}`;
        case "Hide":
            return `${cmd.character}`;
        case "Background":
            return `Hintergrund: ${cmd.asset}`;
        case "Choice":
            return `${cmd.options?.length || 0} Optionen`;
        case "ModifyVariables":
            return `${cmd.effects?.length || 0} Variablen-Effekte`;
        case "Branch":
            return `${cmd.branches?.length || 0} Bedingte Zweige`;
        case "Jump":
            const dest = cmd.target_scene ? `${cmd.target_scene} #${cmd.target_index || 0}` : `#${cmd.target_index || 0}`;
            return `Springe zu: ${dest}`;
        case "PlayBgm":
            return `Musik: ${cmd.path}`;
        case "PlaySfx":
            return `Sound: ${cmd.path}`;
        case "StopBgm":
            return "Musik anhalten";
        case "ShakeWindow":
            return `Fenster schütteln (Intensität ${cmd.intensity}, ${cmd.duration_ms}ms)`;
        case "GlitchText":
            return `Text glitcht für ${cmd.duration}s`;
        case "FakeError":
            return `Fehler popup: "${cmd.title}"`;
        default:
            return "";
    }
}

function drawScriptGraphEdges() {
    const svgGroup = document.getElementById("script-graph-edges");
    const labelsContainer = document.getElementById("script-graph-labels");
    const canvas = document.getElementById("commands-list-container");
    const svg = document.getElementById("script-graph-svg");

    if (!svgGroup || !labelsContainer || !canvas || !svg) return;

    // Clear old lines and labels
    svgGroup.innerHTML = "";
    labelsContainer.innerHTML = "";

    // Resize SVG overlay and transform container dynamically to cover all nodes
    let maxX = 4840;
    let maxY = 4500;
    const cmds = project.scenes[currentSceneId];
    if (cmds) {
        cmds.forEach(cmd => {
            if (cmd.graph_x !== undefined) maxX = Math.max(maxX, cmd.graph_x);
            if (cmd.graph_y !== undefined) maxY = Math.max(maxY, cmd.graph_y);
        });
    }

    const svgWidth = Math.max(10000, maxX + 2000);
    const svgHeight = Math.max(10000, maxY + 2000);

    svg.setAttribute("width", svgWidth);
    svg.setAttribute("height", svgHeight);

    const container = document.getElementById("script-graph-transform-container");
    if (container) {
        container.style.width = svgWidth + "px";
        container.style.height = svgHeight + "px";
    }

    if (!cmds || cmds.length === 0) return;

    const canvasRect = canvas.getBoundingClientRect();

    // Helper to get coordinates of a port in canvas space
    function getPortCoords(selector) {
        const port = document.querySelector(selector);
        if (!port) return null;

        const portRect = port.getBoundingClientRect();
        return {
            x: ((portRect.left + portRect.width / 2 - canvasRect.left) - panX) / zoom,
            y: ((portRect.top + portRect.height / 2 - canvasRect.top) - panY) / zoom
        };
    }

    // Helper to format conditions text
    function formatConditionsText(conditions) {
        if (!conditions || conditions.length === 0) return "";
        return conditions.map(c => {
            if (c.type === "FlagSet") return `Flag: ${c.flag}`;
            if (c.type === "FlagNotSet") return `!Flag: ${c.flag}`;
            if (c.type === "MinAffection") return `Affection ${c.character} >= ${c.value}`;
            if (c.type === "MaxAffection") return `Affection ${c.character} <= ${c.value}`;
            if (c.type === "VarMin") return `${c.name} >= ${c.value}`;
            if (c.type === "VarMax") return `${c.name} <= ${c.value}`;
            if (c.type === "VarEquals") return `${c.name} == ${c.value}`;
            return c.type;
        }).join(" && ");
    }

    // Helper to draw S-curve connection line
    function drawCurve(fromPort, toPort, type, labelText, tooltipText, sourceIdx, edgeType, optIdx) {
        if (!fromPort || !toPort) return;

        const dx = Math.max(80, Math.abs(toPort.x - fromPort.x) * 0.5);
        const ctrlX1 = fromPort.x + dx;
        const ctrlY1 = fromPort.y;
        const ctrlX2 = toPort.x - dx;
        const ctrlY2 = toPort.y;

        const pathD = `M ${fromPort.x} ${fromPort.y} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${toPort.x} ${toPort.y}`;

        // Midpoint of cubic Bezier at t=0.5
        const mx = 0.125 * fromPort.x + 0.375 * ctrlX1 + 0.375 * ctrlX2 + 0.125 * toPort.x;
        const my = 0.125 * fromPort.y + 0.375 * ctrlY1 + 0.375 * ctrlY2 + 0.125 * toPort.y;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", pathD);
        path.setAttribute("class", `edge-line ${type}`);
        if (tooltipText) {
            const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
            title.textContent = tooltipText;
            path.appendChild(title);
        }
        svgGroup.appendChild(path);

        let label;
        if (labelText) {
            label = document.createElement("div");
            label.className = `graph-edge-label ${type}-label`;
            label.style.left = mx + "px";
            label.style.top = my + "px";

            const textSpan = document.createElement("span");
            textSpan.textContent = labelText;
            label.appendChild(textSpan);

            if (sourceIdx !== undefined) {
                const delBtn = document.createElement("button");
                delBtn.className = "edge-delete-inline";
                delBtn.innerHTML = "×";
                delBtn.title = "Verbindung löschen";
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    disconnectEdge(sourceIdx, edgeType, optIdx);
                };
                label.appendChild(delBtn);
            }
            if (tooltipText) {
                label.title = tooltipText;
            }
        } else {
            label = document.createElement("button");
            label.className = "edge-delete-standalone";
            label.innerHTML = "×";
            label.title = "Verbindung löschen";
            label.style.left = mx + "px";
            label.style.top = my + "px";
            label.onclick = (e) => {
                e.stopPropagation();
                disconnectEdge(sourceIdx, edgeType, optIdx);
            };
        }

        label.addEventListener("mouseenter", () => path.classList.add("active"));
        label.addEventListener("mouseleave", () => path.classList.remove("active"));
        labelsContainer.appendChild(label);
    }

    // Draw all edges
    cmds.forEach((cmd, idx) => {
        // 1. Normal Sequential connection (Out -> In)
        if (cmd.type !== "Choice" && cmd.type !== "Branch" && cmd.type !== "Jump") {
            let nextNode = null;
            if (cmd.next_disconnected) {
                // Disconnected, draw nothing!
            } else if (cmd.next_id) {
                nextNode = cmds.find(c => c.id === cmd.next_id);
            } else {
                if (idx + 1 < cmds.length) {
                    nextNode = cmds[idx + 1];
                }
            }

            if (nextNode) {
                const fromPort = getPortCoords(`.port-dot[data-port-out="${idx}"]`);
                const targetIdx = cmds.indexOf(nextNode);
                const toPort = getPortCoords(`.port-dot[data-port-in="${targetIdx}"]`);
                if (fromPort && toPort) {
                    let label = "";
                    let tooltip = "";
                    if (cmd.conditions && cmd.conditions.length > 0) {
                        label = "Wenn Bedingungen";
                        tooltip = formatConditionsText(cmd.conditions);
                    }
                    drawCurve(fromPort, toPort, "normal", label, tooltip, idx, "normal");
                }
            }
        }

        // 2. Choice Branching options connections (Choice Option -> In)
        if (cmd.type === "Choice" && cmd.options) {
            const isExpanded = !!expandedNodes[currentSceneId + "_" + idx];
            cmd.options.forEach((opt, optIdx) => {
                const targetScene = opt.target_scene || currentSceneId;
                const targetIdx = resolveCommandIndex(targetScene, opt.target_id, opt.target_index || 0);

                const fromPort = isExpanded
                    ? getPortCoords(`.port-dot[data-port-choice-out="${idx}-${optIdx}"]`)
                    : getPortCoords(`.port-dot[data-port-choice-collapsed-out="${idx}"]`);
                let label = opt.text || `Option #${optIdx + 1}`;
                let tooltip = "";
                if (opt.conditions && opt.conditions.length > 0) {
                    tooltip += `[Bedingungen]: ${formatConditionsText(opt.conditions)}\n`;
                }
                if (opt.effects && opt.effects.length > 0) {
                    tooltip += `[Effekte]: ${opt.effects.length} variable updates`;
                }

                const isConnected = !!opt.target_id || (opt.target_index > 0);
                if (isConnected) {
                    if (targetScene === currentSceneId) {
                        const toPort = getPortCoords(`.port-dot[data-port-in="${targetIdx}"]`);
                        if (fromPort && toPort) {
                            drawCurve(fromPort, toPort, "choice", label, tooltip, idx, "choice", optIdx);
                        }
                    } else {
                        if (fromPort) {
                            const stubPort = { x: fromPort.x + 120, y: fromPort.y };
                            drawCurve(fromPort, stubPort, "choice", `${label} ➔ ${targetScene}`, tooltip, idx, "choice", optIdx);
                        }
                    }
                }
            });
        }

        // 2.5. Branch connections (Branch Path -> In)
        if (cmd.type === "Branch" && cmd.branches) {
            const isExpanded = !!expandedNodes[currentSceneId + "_" + idx];
            cmd.branches.forEach((branch, branchIdx) => {
                const targetScene = branch.target_scene || currentSceneId;
                const targetIdx = resolveCommandIndex(targetScene, branch.target_id, branch.target_index || 0);

                const fromPort = isExpanded
                    ? getPortCoords(`.port-dot[data-port-branch-out="${idx}-${branchIdx}"]`)
                    : getPortCoords(`.port-dot[data-port-branch-collapsed-out="${idx}"]`);

                let label = `Zweig #${branchIdx + 1}`;
                let tooltip = "";
                if (branch.conditions && branch.conditions.length > 0) {
                    label = `Zweig (Bedingt)`;
                    tooltip = formatConditionsText(branch.conditions);
                }

                const isConnected = !!branch.target_id || (branch.target_index > 0);
                if (isConnected) {
                    if (targetScene === currentSceneId) {
                        const toPort = getPortCoords(`.port-dot[data-port-in="${targetIdx}"]`);
                        if (fromPort && toPort) {
                            drawCurve(fromPort, toPort, "choice", label, tooltip, idx, "branch", branchIdx);
                        }
                    } else {
                        if (fromPort) {
                            const stubPort = { x: fromPort.x + 120, y: fromPort.y };
                            drawCurve(fromPort, stubPort, "choice", `${label} ➔ ${targetScene}`, tooltip, idx, "branch", branchIdx);
                        }
                    }
                }
            });
        }

        // 3. Jump connection (Jump -> In)
        if (cmd.type === "Jump") {
            const targetScene = cmd.target_scene || currentSceneId;
            const targetIdx = resolveCommandIndex(targetScene, cmd.target_id, cmd.target_index || 0);

            const fromPort = getPortCoords(`.port-dot[data-port-jump-out="${idx}"]`);
            let label = "Jump";
            let tooltip = "";
            if (cmd.conditions && cmd.conditions.length > 0) {
                label = "Jump (Bedingt)";
                tooltip = formatConditionsText(cmd.conditions);
            }

            const isConnected = !!cmd.target_id || (cmd.target_index > 0);
            if (isConnected) {
                if (targetScene === currentSceneId) {
                    const toPort = getPortCoords(`.port-dot[data-port-in="${targetIdx}"]`);
                    if (fromPort && toPort) {
                        drawCurve(fromPort, toPort, "jump", label, tooltip, idx, "jump");
                    }
                } else {
                    if (fromPort) {
                        const stubPort = { x: fromPort.x + 120, y: fromPort.y };
                        drawCurve(fromPort, stubPort, "jump", `Jump ➔ ${targetScene}`, tooltip, idx, "jump");
                    }
                }
            }
        }
    });
}

window.createGraphConnection = function (sourceIdx, targetIdx, optIdx, sourceType) {
    const cmds = project.scenes[currentSceneId];
    if (!cmds || !cmds[sourceIdx] || !cmds[targetIdx]) return;

    const targetCmd = cmds[targetIdx];

    if (sourceType === "choice" && optIdx !== undefined) {
        const cmd = cmds[sourceIdx];
        if (cmd && cmd.type === "Choice" && cmd.options && cmd.options[optIdx]) {
            cmd.options[optIdx].target_scene = null;
            cmd.options[optIdx].target_id = targetCmd.id;
            cmd.options[optIdx].target_index = targetIdx;
        }
    } else if (sourceType === "branch" && optIdx !== undefined) {
        const cmd = cmds[sourceIdx];
        if (cmd && cmd.type === "Branch" && cmd.branches && cmd.branches[optIdx]) {
            cmd.branches[optIdx].target_scene = null;
            cmd.branches[optIdx].target_id = targetCmd.id;
            cmd.branches[optIdx].target_index = targetIdx;
        }
    } else if (sourceType === "jump") {
        const cmd = cmds[sourceIdx];
        if (cmd && cmd.type === "Jump") {
            cmd.target_scene = null;
            cmd.target_id = targetCmd.id;
            cmd.target_index = targetIdx;
        }
    } else if (sourceType === "normal") {
        cmds[sourceIdx].next_id = targetCmd.id;
        cmds[sourceIdx].next_disconnected = false;
    }

    renderCommands();
};

window.setRootCommand = function (idx) {
    const cmds = project.scenes[currentSceneId];
    if (!cmds || idx <= 0 || idx >= cmds.length) return;

    const cmdToMove = cmds[idx];
    cmds.splice(idx, 1);
    cmds.unshift(cmdToMove);

    renderCommands();
};

window.playtestFromCommand = function (idx) {
    playtestStartConfig = { sceneId: currentSceneId, index: idx };
    const ptTabBtn = document.querySelector(".tab-btn[data-tab='playtest']");
    if (ptTabBtn) {
        ptTabBtn.click();
    }
};

window.deleteCommand = function (idx) {
    if (confirm(`Befehl #${idx} löschen?`)) {
        const deletedCmd = project.scenes[currentSceneId][idx];
        project.scenes[currentSceneId].splice(idx, 1);

        // Clean up references to this command's ID
        if (deletedCmd && deletedCmd.id) {
            const delId = deletedCmd.id;
            for (const sId in project.scenes) {
                project.scenes[sId].forEach(c => {
                    if (c.next_id === delId) c.next_id = null;
                    if (c.target_id === delId) c.target_id = null;
                    if (c.options) {
                        c.options.forEach(o => {
                            if (o.target_id === delId) o.target_id = null;
                        });
                    }
                    if (c.branches) {
                        c.branches.forEach(b => {
                            if (b.target_id === delId) b.target_id = null;
                        });
                    }
                });
            }
        }

        renderCommands();
    }
};

window.disconnectEdge = function (sourceIdx, type, optIdx) {
    const cmds = project.scenes[currentSceneId];
    if (!cmds || !cmds[sourceIdx]) return;

    if (type === "normal") {
        cmds[sourceIdx].next_disconnected = true;
        cmds[sourceIdx].next_id = null;
    } else if (type === "choice" && optIdx !== undefined) {
        const opt = cmds[sourceIdx].options[optIdx];
        if (opt) {
            opt.target_index = 0;
            opt.target_id = null;
        }
    } else if (type === "branch" && optIdx !== undefined) {
        const branch = cmds[sourceIdx].branches[optIdx];
        if (branch) {
            branch.target_index = 0;
            branch.target_id = null;
        }
    } else if (type === "jump") {
        cmds[sourceIdx].target_index = 0;
        cmds[sourceIdx].target_id = null;
    }

    renderCommands();
};

// Generates the HTML forms for each command type
function renderCommandFields(cmd, idx) {
    let html = "";

    // Character options list helper
    const charOptions = `<option value="">Narrator (Erzähler)</option>` +
        project.characters.map(c => `<option value="${c.id}" ${cmd.character === c.id ? 'selected' : ''}>${c.name}</option>`).join("");

    // Dynamic background options from asset store
    const bgOptions = assetStore.backgrounds.length > 0
        ? assetStore.backgrounds.map(b => `<option value="${b.name}" ${cmd.asset === b.name ? 'selected' : ''}>${b.name}</option>`).join("")
        : `<option value="${escapeHtml(cmd.asset || '')}">${escapeHtml(cmd.asset || '(leer)')}</option>`;

    // Dynamic emotion options for Show command
    function getEmotionOptions(charId, selectedEmotion) {
        const emotions = assetStore.sprites[charId];
        if (emotions && emotions.length > 0) {
            return emotions.map(e => `<option value="${e}" ${selectedEmotion === e ? 'selected' : ''}>${e}</option>`).join("");
        }
        // Fallback: show the current value as only option
        return `<option value="${escapeHtml(selectedEmotion || 'neutral')}" selected>${escapeHtml(selectedEmotion || 'neutral')}</option>`;
    }

    switch (cmd.type) {
        case "Say":
            html = `
                <div style="display:flex; flex-direction:column; gap:12px; width:100%;">
                    <div class="form-group" style="width:100%;">
                        <label style="font-weight:bold;">Sprecher</label>
                        <select class="input-select" style="width:100%;" onchange="updateCmdField(${idx}, 'character', this.value)">${charOptions}</select>
                    </div>
                    <div class="form-group" style="width:100%;">
                        ${renderDynamicTextField('Text', cmd.text, idx)}
                    </div>
                </div>
                ${renderConditionsPanel(cmd.conditions, idx)}
            `;
            break;

        case "Show":
            const emotionField = assetStore.loaded && assetStore.sprites[cmd.character]
                ? `<select class="input-select" onchange="updateCmdField(${idx}, 'emotion', this.value)">${getEmotionOptions(cmd.character, cmd.emotion)}</select>`
                : `<input type="text" class="input-text" value="${escapeHtml(cmd.emotion || 'neutral')}" onchange="updateCmdField(${idx}, 'emotion', this.value)">`;
            html = `
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Charakter</label>
                        <select class="input-select" onchange="updateShowCharacter(${idx}, this.value)">
                            ${project.characters.map(c => `<option value="${c.id}" ${cmd.character === c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Position</label>
                        <select class="input-select" onchange="updateCmdField(${idx}, 'position', this.value)">
                            <option value="Left" ${cmd.position === 'Left' ? 'selected' : ''}>Left</option>
                            <option value="Center" ${cmd.position === 'Center' ? 'selected' : ''}>Center</option>
                            <option value="Right" ${cmd.position === 'Right' ? 'selected' : ''}>Right</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Emotion</label>
                        ${emotionField}
                    </div>
                </div>
                ${renderConditionsPanel(cmd.conditions, idx)}
            `;
            break;

        case "Hide":
            html = `
                <div class="form-group" style="width: 200px;">
                    <label>Charakter ausblenden</label>
                    <select class="input-select" onchange="updateCmdField(${idx}, 'character', this.value)">
                        ${project.characters.map(c => `<option value="${c.id}" ${cmd.character === c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
                    </select>
                </div>
            `;
            break;

        case "Background":
            const hasBgAssets = assetStore.backgrounds.length > 0;
            html = `
                <div class="form-group">
                    <label>Hintergrund</label>
                    ${hasBgAssets
                    ? `<select class="input-select" onchange="updateCmdField(${idx}, 'asset', this.value)">${bgOptions}</select>`
                    : `<input type="text" class="input-text" placeholder="Asset-Name (z.B. cave)" value="${escapeHtml(cmd.asset || '')}" onchange="updateCmdField(${idx}, 'asset', this.value)">`
                }
                    ${!hasBgAssets ? '<span class="asset-hint">💡 Assets-Ordner laden für Auswahl</span>' : ''}
                    ${hasBgAssets && assetStore.bgUrls[cmd.asset] ? `<div class="bg-select-grid" style="margin-top:6px;"><div class="bg-thumb-option selected" style="width:120px;height:68px;background-image:url('${assetStore.bgUrls[cmd.asset]}')"><span class="bg-thumb-label">${escapeHtml(cmd.asset)}</span></div></div>` : ''}
                </div>
            `;
            break;

        case "Choice":
            html = `
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Antwortmöglichkeiten</span>
                        <button class="btn-add-sub" onclick="addChoiceOption(${idx})">+ Option</button>
                    </div>
                    <div class="list-items-container">
                        ${renderChoiceOptions(cmd.options, idx)}
                    </div>
                </div>
            `;
            break;

        case "ModifyVariables":
            html = `
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Variablen-Effekte</span>
                        <button class="btn-add-sub" onclick="addVariableEffect(${idx})">+ Effekt</button>
                    </div>
                    <div class="list-items-container">
                        ${renderVariableEffects(cmd.effects, idx)}
                    </div>
                </div>
            `;
            break;

        case "Jump":
            html = `
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Ziel-Szene</label>
                        <select class="input-select" onchange="updateJumpScene(${idx}, this.value)">
                            <option value="">(Aktuelle Szene)</option>
                            ${Object.keys(project.scenes).map(s => `<option value="${s}" ${cmd.target_scene === s ? 'selected' : ''}>${s}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Ziel-Befehl (# Index)</label>
                        <select class="input-select" id="select-jump-index-${idx}" onchange="updateCmdField(${idx}, 'target_id', this.value)">
                            ${renderCommandIndexOptions(cmd.target_scene || currentSceneId, cmd.target_id)}
                        </select>
                    </div>
                </div>
                ${renderConditionsPanel(cmd.conditions, idx)}
            `;
            break;

        case "PlayBgm": {
            const bgmOptions = assetStore.audio.bgm.length > 0
                ? assetStore.audio.bgm.map(a => `<option value="${a.path}" ${cmd.path === a.path ? 'selected' : ''}>${a.name}.${a.ext}</option>`).join("")
                : '';
            html = `
                <div class="form-group">
                    <label>Hintergrundmusik (BGM)</label>
                    ${bgmOptions
                    ? `<select class="input-select" onchange="updateCmdField(${idx}, 'path', this.value)">${bgmOptions}</select>`
                    : `<input type="text" class="input-text" placeholder="Pfad z.B. audio/bgm/theme.ogg" value="${escapeHtml(cmd.path || '')}" onchange="updateCmdField(${idx}, 'path', this.value)">`
                }
                    ${!bgmOptions ? '<span class="asset-hint">💡 Assets-Ordner laden für Auswahl</span>' : ''}
                </div>
            `;
            break;
        }
        case "PlaySfx": {
            const sfxOptions = assetStore.audio.sfx.length > 0
                ? assetStore.audio.sfx.map(a => `<option value="${a.path}" ${cmd.path === a.path ? 'selected' : ''}>${a.name}.${a.ext}</option>`).join("")
                : '';
            html = `
                <div class="form-group">
                    <label>Soundeffekt (SFX)</label>
                    ${sfxOptions
                    ? `<select class="input-select" onchange="updateCmdField(${idx}, 'path', this.value)">${sfxOptions}</select>`
                    : `<input type="text" class="input-text" placeholder="Pfad z.B. audio/sfx/click.wav" value="${escapeHtml(cmd.path || '')}" onchange="updateCmdField(${idx}, 'path', this.value)">`
                }
                    ${!sfxOptions ? '<span class="asset-hint">💡 Assets-Ordner laden für Auswahl</span>' : ''}
                </div>
            `;
            break;
        }

        case "StopBgm":
            html = `<span style="font-size: 13px; color: var(--text-muted);">Hintergrundmusik anhalten.</span>`;
            break;

        case "ShakeWindow":
            html = `
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Intensität (Pixel)</label>
                        <input type="number" class="input-number" step="0.5" value="${cmd.intensity || 10.0}" onchange="updateCmdField(${idx}, 'intensity', parseFloat(this.value) || 0)">
                    </div>
                    <div class="form-group">
                        <label>Dauer (Millisekunden)</label>
                        <input type="number" class="input-number" value="${cmd.duration_ms || 400}" onchange="updateCmdField(${idx}, 'duration_ms', parseInt(this.value) || 0)">
                    </div>
                </div>
            `;
            break;

        case "GlitchText":
            html = `
                <div class="form-group">
                    <label>Dauer (Sekunden)</label>
                    <input type="number" class="input-number" step="0.1" value="${cmd.duration || 1.0}" onchange="updateCmdField(${idx}, 'duration', parseFloat(this.value) || 0)">
                </div>
            `;
            break;

        case "FakeError":
            html = `
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Fenstertitel</label>
                        <input type="text" class="input-text" value="${escapeHtml(cmd.title || '')}" onchange="updateCmdField(${idx}, 'title', this.value)">
                    </div>
                    <div class="form-group">
                        <label>Fehlermeldung</label>
                        <input type="text" class="input-text" value="${escapeHtml(cmd.message || '')}" onchange="updateCmdField(${idx}, 'message', this.value)">
                    </div>
                </div>
            `;
            break;

        case "Branch":
            html = `
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Bedingte Zweige</span>
                        <button class="btn-add-sub" onclick="addBranchOption(${idx})">+ Zweig</button>
                    </div>
                    <div class="list-items-container">
                        ${renderBranchOptions(cmd.branches, idx)}
                    </div>
                </div>
            `;
            break;
    }

    return html;
}

window.updateCmdField = function (cmdIdx, field, val) {
    project.scenes[currentSceneId][cmdIdx][field] = val;
    const previewEl = document.getElementById(`node-preview-${cmdIdx}`);
    if (previewEl) {
        previewEl.textContent = getNodePreviewText(project.scenes[currentSceneId][cmdIdx]);
    }
    drawScriptGraphEdges();
    saveToLocalStorage();
};

// When changing the character in a Show command, refresh the emotion dropdown
window.updateShowCharacter = function (cmdIdx, charId) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.character = charId;
    // Reset emotion to the first available for this character, if sprites are loaded
    const emotions = assetStore.sprites[charId];
    if (emotions && emotions.length > 0) {
        cmd.emotion = emotions[0];
    }
    renderCommands();
};

window.updateJumpScene = function (cmdIdx, val) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.target_scene = val ? val : null;
    const targetSceneId = cmd.target_scene || currentSceneId;
    const targetCmds = project.scenes[targetSceneId];
    cmd.target_id = (targetCmds && targetCmds.length > 0) ? targetCmds[0].id : null;

    // Refresh the indices selection
    const select = document.getElementById(`select-jump-index-${cmdIdx}`);
    if (select) {
        select.innerHTML = renderCommandIndexOptions(targetSceneId, cmd.target_id);
    }
    drawScriptGraphEdges();
    saveToLocalStorage();
};

function renderCommandIndexOptions(sceneId, selectedId) {
    if (!sceneId || !project.scenes[sceneId]) return `<option value="">(Leer)</option>`;
    return project.scenes[sceneId].map((c, i) => {
        let label = `${i}: [${c.type}] `;
        if (c.type === "Say") {
            const preview = getPreviewText(c.text);
            label += preview.substring(0, 20) + (preview.length > 20 ? "..." : "");
        }
        else if (c.type === "Background") label += c.asset;
        return `<option value="${c.id}" ${selectedId === c.id ? 'selected' : ''}>${label}</option>`;
    }).join("");
}

// --- Choice Option Rendering & Logic ---
function renderChoiceOptions(options, cmdIdx) {
    if (!options) return "";
    return options.map((opt, optIdx) => {
        return `
            <div class="choice-option-row">
                <div class="choice-option-header">
                    <strong style="font-size:12px; color:var(--color-primary-hover)">Option #${optIdx + 1}</strong>
                    <div class="port-container out" style="margin-left:auto; display:inline-flex; align-items:center;">
                        <div class="port-dot choice-port" data-port-choice-out="${cmdIdx}-${optIdx}"></div>
                    </div>
                    <button class="btn-icon text-danger" style="font-size:14px; margin-left:26px;" onclick="deleteChoiceOption(${cmdIdx}, ${optIdx})">×</button>
                </div>
                <div class="form-group" style="width: 100%;">
                    ${renderDynamicTextField('Optionen-Text', opt.text, cmdIdx, optIdx)}
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Ziel-Szene</label>
                        <select class="input-select" onchange="updateChoiceJumpScene(${cmdIdx}, ${optIdx}, this.value)">
                            <option value="">(Aktuelle Szene)</option>
                            ${Object.keys(project.scenes).map(s => `<option value="${s}" ${opt.target_scene === s ? 'selected' : ''}>${s}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Ziel-Befehl (# Index)</label>
                        <select class="input-select" id="select-choice-jump-idx-${cmdIdx}-${optIdx}" onchange="updateChoiceOption(${cmdIdx}, ${optIdx}, 'target_id', this.value)">
                            ${renderCommandIndexOptions(opt.target_scene || currentSceneId, opt.target_id)}
                        </select>
                    </div>
                </div>
                
                <!-- Choice option sub conditions -->
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Anzeigebedingungen</span>
                        <button class="btn-add-sub" onclick="addChoiceCondition(${cmdIdx}, ${optIdx})">+ Bedingung</button>
                    </div>
                    <div class="list-items-container">
                        ${renderConditionItems(opt.conditions, `choice-cond-${cmdIdx}-${optIdx}`, (cIdx) => deleteChoiceCondition(cmdIdx, optIdx, cIdx), (cIdx, fld, v) => updateChoiceCondition(cmdIdx, optIdx, cIdx, fld, v))}
                    </div>
                </div>

                <!-- Choice option sub effects -->
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Auswirkungen (Variablen / Affection)</span>
                        <button class="btn-add-sub" onclick="addChoiceEffect(${cmdIdx}, ${optIdx})">+ Effekt</button>
                    </div>
                    <div class="list-items-container">
                        ${renderEffectItems(opt.effects, `choice-eff-${cmdIdx}-${optIdx}`, (eIdx) => deleteChoiceEffect(cmdIdx, optIdx, eIdx), (eIdx, fld, v) => updateChoiceEffect(cmdIdx, optIdx, eIdx, fld, v))}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.addChoiceOption = function (cmdIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.options.push({ text: "Neue Antwort...", target_scene: null, target_id: null, effects: [], conditions: [] });
    renderCommands();
};

window.deleteChoiceOption = function (cmdIdx, optIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.options.splice(optIdx, 1);
    renderCommands();
};

window.updateChoiceOption = function (cmdIdx, optIdx, field, val) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx][field] = val;
    drawScriptGraphEdges();
    saveToLocalStorage();
};

window.updateChoiceJumpScene = function (cmdIdx, optIdx, val) {
    const opt = project.scenes[currentSceneId][cmdIdx].options[optIdx];
    opt.target_scene = val ? val : null;
    const targetSceneId = opt.target_scene || currentSceneId;
    const targetCmds = project.scenes[targetSceneId];
    opt.target_id = (targetCmds && targetCmds.length > 0) ? targetCmds[0].id : null;

    // Refresh indices select
    const select = document.getElementById(`select-choice-jump-idx-${cmdIdx}-${optIdx}`);
    if (select) {
        select.innerHTML = renderCommandIndexOptions(targetSceneId, opt.target_id);
    }
    drawScriptGraphEdges();
    saveToLocalStorage();
};

// --- Branch Option Rendering & Logic ---
function renderBranchOptions(branches, cmdIdx) {
    if (!branches) return "";
    return branches.map((branch, branchIdx) => {
        return `
            <div class="choice-option-row">
                <div class="choice-option-header">
                    <strong style="font-size:12px; color:var(--color-primary-hover)">Zweig #${branchIdx + 1}</strong>
                    <div class="port-container out" style="margin-left:auto; display:inline-flex; align-items:center;">
                        <div class="port-dot branch-port" data-port-branch-out="${cmdIdx}-${branchIdx}"></div>
                    </div>
                    <button class="btn-icon text-danger" style="font-size:14px; margin-left:8px;" onclick="deleteBranchOption(${cmdIdx}, ${branchIdx})">×</button>
                </div>
                <div class="form-group-row">
                    <div class="form-group">
                        <label>Ziel-Szene</label>
                        <select class="input-select" onchange="updateBranchJumpScene(${cmdIdx}, ${branchIdx}, this.value)">
                            <option value="">(Aktuelle Szene)</option>
                            ${Object.keys(project.scenes).map(s => `<option value="${s}" ${branch.target_scene === s ? 'selected' : ''}>${s}</option>`).join("")}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Ziel-Befehl (# Index)</label>
                        <select class="input-select" id="select-branch-jump-idx-${cmdIdx}-${branchIdx}" onchange="updateBranchOption(${cmdIdx}, ${branchIdx}, 'target_id', this.value)">
                            ${renderCommandIndexOptions(branch.target_scene || currentSceneId, branch.target_id)}
                        </select>
                    </div>
                </div>
                
                <!-- Branch path sub conditions -->
                <div class="sub-panel">
                    <div class="sub-panel-title">
                        <span>Pfad-Bedingungen</span>
                        <button class="btn-add-sub" onclick="addBranchCondition(${cmdIdx}, ${branchIdx})">+ Bedingung</button>
                    </div>
                    <div class="list-items-container">
                        ${renderConditionItems(branch.conditions, `branch-cond-${cmdIdx}-${branchIdx}`, (cIdx) => deleteBranchCondition(cmdIdx, branchIdx, cIdx), (cIdx, fld, v) => updateBranchCondition(cmdIdx, branchIdx, cIdx, fld, v))}
                    </div>
                </div>
            </div>
        `;
    }).join("");
}

window.addBranchOption = function (cmdIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    if (!cmd.branches) cmd.branches = [];
    cmd.branches.push({ target_scene: null, target_id: null, conditions: [] });
    renderCommands();
};

window.deleteBranchOption = function (cmdIdx, branchIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.branches.splice(branchIdx, 1);
    renderCommands();
};

window.updateBranchOption = function (cmdIdx, branchIdx, field, val) {
    project.scenes[currentSceneId][cmdIdx].branches[branchIdx][field] = val;
    drawScriptGraphEdges();
    saveToLocalStorage();
};

window.updateBranchJumpScene = function (cmdIdx, branchIdx, val) {
    const branch = project.scenes[currentSceneId][cmdIdx].branches[branchIdx];
    branch.target_scene = val ? val : null;
    const targetSceneId = branch.target_scene || currentSceneId;
    const targetCmds = project.scenes[targetSceneId];
    branch.target_id = (targetCmds && targetCmds.length > 0) ? targetCmds[0].id : null;

    // Refresh indices select
    const select = document.getElementById(`select-branch-jump-idx-${cmdIdx}-${branchIdx}`);
    if (select) {
        select.innerHTML = renderCommandIndexOptions(targetSceneId, branch.target_id);
    }
    drawScriptGraphEdges();
    saveToLocalStorage();
};

window.addBranchCondition = function (cmdIdx, branchIdx) {
    const branch = project.scenes[currentSceneId][cmdIdx].branches[branchIdx];
    if (!branch.conditions) branch.conditions = [];
    branch.conditions.push({ type: "FlagSet", flag: "" });
    renderCommands();
};

window.deleteBranchCondition = function (cmdIdx, branchIdx, condIdx) {
    const branch = project.scenes[currentSceneId][cmdIdx].branches[branchIdx];
    branch.conditions.splice(condIdx, 1);
    renderCommands();
};

window.updateBranchCondition = function (cmdIdx, branchIdx, condIdx, field, val) {
    const branch = project.scenes[currentSceneId][cmdIdx].branches[branchIdx];
    branch.conditions[condIdx][field] = val;
    saveToLocalStorage();
};

// --- Conditions Panel (Say, Show, Jump) ---
function renderConditionsPanel(conditions, cmdIdx) {
    return `
        <div class="sub-panel">
            <div class="sub-panel-title">
                <span>Bedingungen zum Ausführen</span>
                <button class="btn-add-sub" onclick="addCmdCondition(${cmdIdx})">+ Bedingung</button>
            </div>
            <div class="list-items-container">
                ${renderConditionItems(conditions, `cmd-cond-${cmdIdx}`, (cIdx) => deleteCmdCondition(cmdIdx, cIdx), (cIdx, fld, v) => updateCmdCondition(cmdIdx, cIdx, fld, v))}
            </div>
        </div>
    `;
}

window.addCmdCondition = function (cmdIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.conditions.push({ type: "FlagSet", flag: project.variables.flags[0] || "flag" });
    renderCommands();
};

window.deleteCmdCondition = function (cmdIdx, condIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.conditions.splice(condIdx, 1);
    renderCommands();
};

window.updateCmdCondition = function (cmdIdx, condIdx, field, val) {
    const cond = project.scenes[currentSceneId][cmdIdx].conditions[condIdx];
    cond[field] = val;
    renderCommands(); // Rerender to show relevant fields (like min/max fields)
};

// General Conditions Form Generator
// Registry to store condition handlers by prefix (fixes closure bug)
const conditionHandlerRegistry = {};

function renderConditionItems(conditions, uniquePrefix, onDelete, onChange) {
    if (!conditions || conditions.length === 0) {
        return `<span style="font-size:11px; color:var(--text-muted); font-style:italic;">Keine Bedingungen. Wird immer ausgeführt.</span>`;
    }

    // Register handlers for this prefix ONCE (outside the loop)
    conditionHandlerRegistry[uniquePrefix] = { onDelete, onChange, conditions };

    return conditions.map((cond, idx) => {
        let fieldsHtml = "";

        // Setup change handler wrapper string
        const handleTypeChange = `onChangeConditionType('${uniquePrefix}', ${idx}, this.value)`;

        const condTypeSelect = `
            <select class="input-select" style="width:130px; font-size:11px; padding:4px;" onchange="${handleTypeChange}">
                <option value="FlagSet" ${cond.type === 'FlagSet' ? 'selected' : ''}>Flag gesetzt</option>
                <option value="FlagNotSet" ${cond.type === 'FlagNotSet' ? 'selected' : ''}>Flag nicht gesetzt</option>
                <option value="MinAffection" ${cond.type === 'MinAffection' ? 'selected' : ''}>Affection Min</option>
                <option value="MaxAffection" ${cond.type === 'MaxAffection' ? 'selected' : ''}>Affection Max</option>
                <option value="VarMin" ${cond.type === 'VarMin' ? 'selected' : ''}>Var Min</option>
                <option value="VarMax" ${cond.type === 'VarMax' ? 'selected' : ''}>Var Max</option>
                <option value="VarEquals" ${cond.type === 'VarEquals' ? 'selected' : ''}>Var Gleich</option>
            </select>
        `;

        // Cache change wrapper string
        const changeVal = (f, isInt) => `window.dispatchCondChange('${uniquePrefix}', ${idx}, '${f}', ${isInt ? 'parseInt(this.value)' : 'this.value'})`;

        if (cond.type === "FlagSet" || cond.type === "FlagNotSet") {
            const flagName = cond.flag || cond.FlagSet || cond.FlagNotSet || "";
            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px;" onchange="${changeVal('flag', false)}">
                    ${project.variables.flags.map(f => `<option value="${f}" ${flagName === f ? 'selected' : ''}>${f}</option>`).join("")}
                </select>
            `;
        } else if (cond.type === "MinAffection" || cond.type === "MaxAffection") {
            const charId = cond.character || "";
            const val = cond.value !== undefined ? cond.value : 0;
            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px; width:90px;" onchange="${changeVal('character', false)}">
                    ${project.characters.map(c => `<option value="${c.id}" ${charId === c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
                </select>
                <input type="number" class="input-number" style="font-size:11px; padding:4px; width:50px;" value="${val}" onchange="${changeVal('value', true)}">
            `;
        } else if (cond.type === "VarMin" || cond.type === "VarMax" || cond.type === "VarEquals") {
            const varName = cond.name || "";
            const val = cond.value !== undefined ? cond.value : 0;
            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px; width:120px;" onchange="${changeVal('name', false)}">
                    ${Object.keys(project.variables.numbers).map(n => `<option value="${n}" ${varName === n ? 'selected' : ''}>${n}</option>`).join("")}
                </select>
                <input type="number" class="input-number" style="font-size:11px; padding:4px; width:50px;" value="${val}" onchange="${changeVal('value', true)}">
            `;
        }

        return `
            <div class="condition-item">
                ${condTypeSelect}
                ${fieldsHtml}
                <button class="btn-icon text-danger" style="font-size:12px; padding:0 4px;" onclick="window.dispatchCondDelete('${uniquePrefix}', ${idx})">×</button>
            </div>
        `;
    }).join("");
}

// Global condition dispatchers that look up the correct handler from the registry
window.dispatchCondChange = function (pref, cIdx, field, val) {
    const handler = conditionHandlerRegistry[pref];
    if (handler) handler.onChange(cIdx, field, val);
};

window.onChangeConditionType = function (pref, cIdx, type) {
    const handler = conditionHandlerRegistry[pref];
    if (!handler) return;

    let defaultVal = {};
    if (type === "FlagSet" || type === "FlagNotSet") {
        defaultVal = { type, flag: project.variables.flags[0] || "flag" };
    } else if (type === "MinAffection" || type === "MaxAffection") {
        defaultVal = { type, character: project.characters[0]?.id || "grug", value: 0 };
    } else {
        defaultVal = { type, name: Object.keys(project.variables.numbers)[0] || "var", value: 0 };
    }
    handler.onDelete(cIdx);
    handler.conditions.splice(cIdx, 0, defaultVal);
    renderCommands();
};

window.dispatchCondDelete = function (pref, idx) {
    // Find the original deletion handler via regex parse of prefix
    // pref is e.g. cmd-cond-5 (idx=5 in commands) or choice-cond-5-0 (cmd=5, opt=0)
    const pts = pref.split("-");
    if (pts[0] === "cmd") {
        const cmdIdx = parseInt(pts[2]);
        deleteCmdCondition(cmdIdx, idx);
    } else {
        const cmdIdx = parseInt(pts[2]);
        const optIdx = parseInt(pts[3]);
        deleteChoiceCondition(cmdIdx, optIdx, idx);
    }
};

window.deleteChoiceCondition = function (cmdIdx, optIdx, condIdx) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].conditions.splice(condIdx, 1);
    renderCommands();
};

window.addChoiceCondition = function (cmdIdx, optIdx) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].conditions.push({ type: "FlagSet", flag: project.variables.flags[0] || "flag" });
    renderCommands();
};

window.updateChoiceCondition = function (cmdIdx, optIdx, condIdx, field, val) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].conditions[condIdx][field] = val;
};


// --- Effects Panel (Choice option / ModifyVariables command) ---
function renderVariableEffects(effects, cmdIdx) {
    return renderEffectItems(effects, `cmd-eff-${cmdIdx}`, (eIdx) => deleteCmdEffect(cmdIdx, eIdx), (eIdx, fld, v) => updateCmdEffect(cmdIdx, eIdx, fld, v));
}

window.addVariableEffect = function (cmdIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.effects.push({ type: "SetFlag", name: project.variables.flags[0] || "flag", value: true });
    renderCommands();
};

window.deleteCmdEffect = function (cmdIdx, effIdx) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    cmd.effects.splice(effIdx, 1);
    renderCommands();
};

window.updateCmdEffect = function (cmdIdx, effIdx, field, val) {
    const eff = project.scenes[currentSceneId][cmdIdx].effects[effIdx];
    eff[field] = val;
    renderCommands();
};

// General Effects Form Generator
// Registry to store effect handlers by prefix (fixes closure bug)
const effectHandlerRegistry = {};

function renderEffectItems(effects, uniquePrefix, onDelete, onChange) {
    if (!effects || effects.length === 0) {
        return `<span style="font-size:11px; color:var(--text-muted); font-style:italic;">Keine Auswirkungen.</span>`;
    }

    // Register handlers for this prefix ONCE (outside the loop)
    effectHandlerRegistry[uniquePrefix] = { onDelete, onChange, effects };

    return effects.map((eff, idx) => {
        let fieldsHtml = "";

        const handleTypeChange = `onChangeEffectType('${uniquePrefix}', ${idx}, this.value)`;

        const effTypeSelect = `
            <select class="input-select" style="width:130px; font-size:11px; padding:4px;" onchange="${handleTypeChange}">
                <option value="SetFlag" ${eff.type === 'SetFlag' ? 'selected' : ''}>Flag setzen (Bool)</option>
                <option value="ChangeVar" ${eff.type === 'ChangeVar' ? 'selected' : ''}>Variable ändern (+/-)</option>
                <option value="SetVar" ${eff.type === 'SetVar' ? 'selected' : ''}>Variable festlegen (=)</option>
                <option value="ChangeAffection" ${eff.type === 'ChangeAffection' ? 'selected' : ''}>Affection ändern</option>
            </select>
        `;

        const changeVal = (f, isInt) => `window.dispatchEffChange('${uniquePrefix}', ${idx}, '${f}', ${isInt ? 'parseInt(this.value)' : 'this.value'})`;
        const changeBool = () => `window.dispatchEffChange('${uniquePrefix}', ${idx}, 'value', this.value === 'true')`;

        if (eff.type === "SetFlag") {
            const flagName = eff.name || "";
            const flagVal = eff.value !== undefined ? eff.value : true;
            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px; width:120px;" onchange="${changeVal('name', false)}">
                    ${project.variables.flags.map(f => `<option value="${f}" ${flagName === f ? 'selected' : ''}>${f}</option>`).join("")}
                </select>
                <select class="input-select" style="font-size:11px; padding:4px; width:70px;" onchange="${changeBool()}">
                    <option value="true" ${flagVal === true ? 'selected' : ''}>TRUE</option>
                    <option value="false" ${flagVal === false ? 'selected' : ''}>FALSE</option>
                </select>
            `;
        } else if (eff.type === "ChangeVar" || eff.type === "SetVar") {
            const varName = eff.name || "";
            const isSet = eff.type === "SetVar";
            // In Rust schema, ChangeVar uses "delta" and SetVar uses "value"
            const valField = isSet ? "value" : "delta";
            const val = eff[valField] !== undefined ? eff[valField] : 1;

            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px; width:120px;" onchange="${changeVal('name', false)}">
                    ${Object.keys(project.variables.numbers).map(n => `<option value="${n}" ${varName === n ? 'selected' : ''}>${n}</option>`).join("")}
                </select>
                <input type="number" class="input-number" style="font-size:11px; padding:4px; width:65px;" value="${val}" onchange="${changeVal(valField, true)}">
            `;
        } else if (eff.type === "ChangeAffection") {
            const charId = eff.character || "";
            const delta = eff.delta !== undefined ? eff.delta : 1;
            fieldsHtml = `
                <select class="input-select" style="font-size:11px; padding:4px; width:100px;" onchange="${changeVal('character', false)}">
                    ${project.characters.map(c => `<option value="${c.id}" ${charId === c.id ? 'selected' : ''}>${c.name}</option>`).join("")}
                </select>
                <input type="number" class="input-number" style="font-size:11px; padding:4px; width:55px;" value="${delta}" onchange="${changeVal('delta', true)}">
            `;
        }

        return `
            <div class="effect-item">
                ${effTypeSelect}
                ${fieldsHtml}
                <button class="btn-icon text-danger" style="font-size:12px; padding:0 4px;" onclick="window.dispatchEffDelete('${uniquePrefix}', ${idx})">×</button>
            </div>
        `;
    }).join("");
}

// Global effect dispatchers that look up the correct handler from the registry
window.dispatchEffChange = function (pref, eIdx, field, val) {
    const handler = effectHandlerRegistry[pref];
    if (handler) handler.onChange(eIdx, field, val);
};

window.onChangeEffectType = function (pref, eIdx, type) {
    const handler = effectHandlerRegistry[pref];
    if (!handler) return;

    let defaultVal = {};
    if (type === "SetFlag") {
        defaultVal = { type, name: project.variables.flags[0] || "flag", value: true };
    } else if (type === "ChangeVar") {
        defaultVal = { type, name: Object.keys(project.variables.numbers)[0] || "var", delta: 1 };
    } else if (type === "SetVar") {
        defaultVal = { type, name: Object.keys(project.variables.numbers)[0] || "var", value: 0 };
    } else {
        defaultVal = { type, character: project.characters[0]?.id || "grug", delta: 1 };
    }
    handler.onDelete(eIdx);
    handler.effects.splice(eIdx, 0, defaultVal);
    renderCommands();
};

window.dispatchEffDelete = function (pref, idx) {
    const pts = pref.split("-");
    if (pts[0] === "cmd") {
        const cmdIdx = parseInt(pts[2]);
        deleteCmdEffect(cmdIdx, idx);
    } else {
        const cmdIdx = parseInt(pts[2]);
        const optIdx = parseInt(pts[3]);
        deleteChoiceEffect(cmdIdx, optIdx, idx);
    }
};

window.deleteChoiceEffect = function (cmdIdx, optIdx, effIdx) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].effects.splice(effIdx, 1);
    renderCommands();
};

window.addChoiceEffect = function (cmdIdx, optIdx) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].effects.push({ type: "ChangeAffection", character: project.characters[0]?.id || "grug", delta: 1 });
    renderCommands();
};

window.updateChoiceEffect = function (cmdIdx, optIdx, effIdx, field, val) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].effects[effIdx][field] = val;
};


// --- SVG Visual Flow Graph ---
function renderSceneGraph() {
    const svg = document.getElementById("scene-graph-svg");
    const container = document.getElementById("graph-content");
    container.innerHTML = "";

    const scenes = Object.keys(project.scenes);
    if (scenes.length === 0) return;

    // Layout Calculation
    // We'll place nodes in a dynamic grid. Let's trace links to form hierarchy columns.
    const nodes = {};
    const layers = {};

    // Simple heuristic: group scenes by connectivity
    // Start scene is layer 0
    const visited = new Set();
    const queue = [{ id: project.start_scene, layer: 0 }];

    while (queue.length > 0) {
        const curr = queue.shift();
        if (visited.has(curr.id) || !curr.id) continue;
        visited.add(curr.id);

        nodes[curr.id] = { id: curr.id, layer: curr.layer };
        if (!layers[curr.layer]) layers[curr.layer] = [];
        layers[curr.layer].push(curr.id);

        // Find outgoing connections
        const targets = getOutgoingJumps(curr.id);
        targets.forEach(tgt => {
            if (!visited.has(tgt)) {
                queue.push({ id: tgt, layer: curr.layer + 1 });
            }
        });
    }

    // Handle orphaned/unreachable scenes
    scenes.forEach(s => {
        if (!visited.has(s)) {
            nodes[s] = { id: s, layer: 0 };
            if (!layers[0]) layers[0] = [];
            layers[0].push(s);
        }
    });

    // Node dimensions & layout constants
    const nodeW = 160;
    const nodeH = 60;
    const dx = 240; // horizontal spacing
    const dy = 100; // vertical spacing
    const startX = 50;
    const startY = 100;

    // Assign coordinate positions
    const positions = {};
    Object.keys(layers).forEach(layerStr => {
        const layer = parseInt(layerStr);
        const list = layers[layer];
        list.forEach((sceneId, idx) => {
            positions[sceneId] = {
                x: startX + layer * dx,
                y: startY + idx * dy
            };
        });
    });

    // 1. Draw Links (Behind Nodes)
    scenes.forEach(srcId => {
        const targets = getOutgoingJumps(srcId);
        const srcPos = positions[srcId];
        if (!srcPos) return;

        targets.forEach(tgtId => {
            const tgtPos = positions[tgtId];
            if (!tgtPos) return;

            // Connect coordinates
            const x1 = srcPos.x + nodeW;
            const y1 = srcPos.y + nodeH / 2;
            const x2 = tgtPos.x;
            const y2 = tgtPos.y + nodeH / 2;

            // Draw smooth cubic Bezier path
            const ctrlX1 = x1 + 50;
            const ctrlY1 = y1;
            const ctrlX2 = x2 - 50;
            const ctrlY2 = y2;

            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${x1} ${y1} C ${ctrlX1} ${ctrlY1}, ${ctrlX2} ${ctrlY2}, ${x2} ${y2}`);
            path.setAttribute("class", "graph-link");
            container.appendChild(path);
        });
    });

    // 2. Draw Nodes
    scenes.forEach(sceneId => {
        const pos = positions[sceneId];
        if (!pos) return;

        const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
        g.setAttribute("class", "graph-node" + (sceneId === currentSceneId ? " active" : ""));
        g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);

        // Rect
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("width", nodeW);
        rect.setAttribute("height", nodeH);
        g.appendChild(rect);

        // Scene Title text
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("x", 12);
        text.setAttribute("y", 26);
        text.setAttribute("class", "title");
        text.textContent = sceneId.length > 18 ? sceneId.substring(0, 16) + "..." : sceneId;
        g.appendChild(text);

        // Command Count subtitle text
        const cmdCount = project.scenes[sceneId].length;
        const sub = document.createElementNS("http://www.w3.org/2000/svg", "text");
        sub.setAttribute("x", 12);
        sub.setAttribute("y", 44);
        sub.setAttribute("class", "subtitle");
        sub.textContent = `${cmdCount} Befehle${sceneId === project.start_scene ? ' | START' : ''}`;
        g.appendChild(sub);

        // Click handler to select and switch to editor
        g.addEventListener("click", () => {
            selectScene(sceneId);
            // Switch tab back to script editor
            document.querySelector(".tab-btn[data-tab='script']").click();
        });

        container.appendChild(g);
    });

    // Adjust SVG bounding box dimensions dynamically
    let maxValX = 800;
    let maxValY = 500;
    Object.values(positions).forEach(pos => {
        if (pos.x + dx > maxValX) maxValX = pos.x + dx;
        if (pos.y + dy > maxValY) maxValY = pos.y + dy;
    });
    svg.setAttribute("width", maxValX);
    svg.setAttribute("height", maxValY);
}

// Scans a scene's commands for references to other scenes
function getOutgoingJumps(sceneId) {
    const targets = new Set();
    const cmds = project.scenes[sceneId] || [];
    cmds.forEach(cmd => {
        if (cmd.type === "Jump" || cmd.type === "JumpToScene") {
            if (cmd.target_scene) targets.add(cmd.target_scene);
        } else if (cmd.type === "Choice") {
            cmd.options.forEach(opt => {
                if (opt.target_scene) targets.add(opt.target_scene);
            });
        } else if (cmd.type === "Branch") {
            cmd.branches?.forEach(branch => {
                if (branch.target_scene) targets.add(branch.target_scene);
            });
        }
    });
    return Array.from(targets);
}


// --- Playtester Simulator Engine ---
function initPlaytestControls() {
    document.getElementById("btn-pt-reset").addEventListener("click", () => {
        initPlaytester();
    });

    document.getElementById("btn-pt-ff").addEventListener("click", () => {
        ptState.isFastForward = !ptState.isFastForward;
        const btn = document.getElementById("btn-pt-ff");
        if (ptState.isFastForward) {
            btn.classList.add("btn-primary");
            btn.classList.remove("btn-secondary");
            // Jump typing typewriter instantly
            if (ptState.typingInterval) skipTypewriter();
        } else {
            btn.classList.add("btn-secondary");
            btn.classList.remove("btn-primary");
        }
    });

    // Advanced typewriter skipping / click viewport to advance
    document.getElementById("pt-textbox").addEventListener("click", () => {
        if (!ptState.active) return;
        advancePlaytest();
    });
}

let playtestStartConfig = null;

function initPlaytester() {
    // Clear typing
    if (ptState.typingInterval) clearInterval(ptState.typingInterval);
    stopAllPtAudio();

    ptState.active = true;

    if (playtestStartConfig) {
        ptState.currentSceneId = playtestStartConfig.sceneId;
        ptState.currentIndex = playtestStartConfig.index;
        playtestStartConfig = null;
    } else {
        ptState.currentSceneId = project.start_scene || Object.keys(project.scenes)[0] || "";
        ptState.currentIndex = 0;
    }

    ptState.shownCharacters = [];
    ptState.log = [];

    // Initialise variables defaults
    ptState.variables = {};
    project.variables.flags.forEach(f => {
        ptState.variables[f] = false;
    });
    Object.keys(project.variables.numbers).forEach(n => {
        ptState.variables[n] = project.variables.numbers[n];
    });

    // Initialise player variables
    if (!project.player_variables) {
        project.player_variables = { name: "Spieler", pronoun: "Er" };
    }
    ptState.player_name = project.player_variables.name || "Spieler";
    ptState.player_pronoun = project.player_variables.pronoun || "Er";

    ptState.affection = {};
    project.characters.forEach(c => {
        ptState.affection[c.id] = 0;
    });

    document.getElementById("pt-status-info").textContent = "Laufend";
    logPtEvent(`Playtester gestartet. Szene: ${ptState.currentSceneId} (Befehl #${ptState.currentIndex})`, "system");

    // Reset Viewport styles
    const ptBg = document.getElementById("pt-background");
    ptBg.className = "pt-background";
    ptBg.style.backgroundColor = "";
    ptBg.style.backgroundImage = "";
    document.getElementById("pt-characters").innerHTML = "";
    document.getElementById("pt-textbox").classList.add("hidden");
    document.getElementById("pt-choices-overlay").classList.add("hidden");

    syncPlaytestDebugger();
    runPlaytestCommand();
}

function logPtEvent(text, type = "info") {
    ptState.log.push({ text, type });
    const logBox = document.getElementById("dbg-log");
    const entry = document.createElement("div");
    entry.className = `dbg-log-entry ${type}`;
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    logBox.appendChild(entry);
    logBox.scrollTop = logBox.scrollHeight;
}

function syncPlaytestDebugger() {
    const list = document.getElementById("dbg-variables-list");
    list.innerHTML = "";

    // Flags
    project.variables.flags.forEach(f => {
        const val = ptState.variables[f];
        const item = document.createElement("div");
        item.className = "dbg-var-item";
        item.innerHTML = `
            <span>${f}</span>
            <input type="checkbox" ${val ? 'checked' : ''} onchange="updatePtFlag('${f}', this.checked)">
        `;
        list.appendChild(item);
    });

    // Variables
    Object.keys(project.variables.numbers).forEach(n => {
        const val = ptState.variables[n];
        const item = document.createElement("div");
        item.className = "dbg-var-item";
        item.innerHTML = `
            <span>${n}</span>
            <input type="number" value="${val !== undefined ? val : 0}" onchange="updatePtNumber('${n}', parseInt(this.value) || 0)">
        `;
        list.appendChild(item);
    });

    // Affections
    project.characters.forEach(c => {
        const val = ptState.affection[c.id];
        const item = document.createElement("div");
        item.className = "dbg-var-item";
        item.innerHTML = `
            <span>Affection: ${c.name}</span>
            <input type="number" value="${val !== undefined ? val : 0}" style="color:hsl(25, 75%, 65%);" onchange="updatePtAffection('${c.id}', parseInt(this.value) || 0)">
        `;
        list.appendChild(item);
    });
}

window.updatePtFlag = function (flag, checked) {
    ptState.variables[flag] = checked;
    logPtEvent(`Flag "${flag}" manuell geändert auf ${checked ? 'TRUE' : 'FALSE'}`, 'system');
};

window.updatePtNumber = function (name, val) {
    ptState.variables[name] = val;
    logPtEvent(`Variable "${name}" manuell geändert auf ${val}`, 'system');
};

window.updatePtAffection = function (charId, val) {
    ptState.affection[charId] = val;
    logPtEvent(`Affection für ${charId} manuell geändert auf ${val}`, 'system');
};

// Renders characters currently shown
function drawPlaytestCharacters() {
    const container = document.getElementById("pt-characters");
    container.innerHTML = "";
    ptState.shownCharacters.forEach(ch => {
        const charDef = project.characters.find(c => c.id === ch.id);
        const name = charDef ? charDef.name : ch.id;

        let positionLeft = "50%";
        if (ch.position === "Left") positionLeft = "20%";
        else if (ch.position === "Right") positionLeft = "80%";

        // Try to find real sprite from asset store
        const spriteKey = `${ch.id}_${ch.emotion}`.toLowerCase();
        let spriteUrl = assetStore.spriteUrls[spriteKey];

        const spr = document.createElement("div");
        spr.className = "pt-char-sprite";
        spr.style.left = positionLeft;

        let hasImg = false;
        if (spriteUrl) {
            hasImg = true;
        } else {
            // Fallback to relative path
            spriteUrl = `../assets/sprites/${ch.id}_${ch.emotion}.png`;
            hasImg = true;
        }

        if (hasImg) {
            spr.innerHTML = `
                <img src="${spriteUrl}" alt="${name}" style="max-height:100%;max-width:100%;object-fit:contain;" onerror="handlePtSpriteError(this, '${ch.id}', '${name}', '${ch.emotion}')">
                <div class="pt-char-name-label">${name} (${ch.emotion})</div>
            `;
        }
        container.appendChild(spr);
    });
}

window.handlePtSpriteError = function (imgEl, charId, name, emotion) {
    const parent = imgEl.parentElement;
    if (!parent) return;

    let hue = 0;
    for (let i = 0; i < charId.length; i++) hue = (hue + charId.charCodeAt(i) * 37) % 360;
    const placeholderColor = `hsl(${hue}, 35%, 45%)`;

    parent.innerHTML = `
        <div class="pt-char-avatar" style="background-color: ${placeholderColor}">
            <div class="eyes">
                <div class="eye"></div>
                <div class="eye"></div>
            </div>
        </div>
        <div class="pt-char-name-label">${name} (${emotion})</div>
    `;
};

function advancePlaytestIndex() {
    const cmds = project.scenes[ptState.currentSceneId];
    if (!cmds) {
        ptState.currentIndex++;
        return;
    }
    const cmd = cmds[ptState.currentIndex];
    if (!cmd) {
        ptState.currentIndex++;
        return;
    }

    if (cmd.next_disconnected) {
        ptState.currentIndex = cmds.length;
    } else if (cmd.next_id) {
        const nextIdx = cmds.findIndex(c => c.id === cmd.next_id);
        if (nextIdx !== -1) {
            ptState.currentIndex = nextIdx;
        } else {
            ptState.currentIndex = cmds.length;
        }
    } else {
        ptState.currentIndex++;
    }
}

function runPlaytestCommand() {
    if (!ptState.active) return;

    const sceneCmds = project.scenes[ptState.currentSceneId];
    if (!sceneCmds || ptState.currentIndex >= sceneCmds.length) {
        logPtEvent(`Szene "${ptState.currentSceneId}" beendet.`, "system");
        document.getElementById("pt-status-info").textContent = "Beendet";
        ptState.active = false;
        stopAllPtAudio();
        return;
    }

    const cmd = sceneCmds[ptState.currentIndex];

    // Evaluate Conditions
    if (cmd.conditions && cmd.conditions.length > 0) {
        const check = evaluateConditions(cmd.conditions);
        if (!check) {
            logPtEvent(`Bedingung nicht erfüllt für Befehl #${ptState.currentIndex} [${cmd.type}]. Überspringe.`, "info");
            advancePlaytestIndex();
            runPlaytestCommand();
            return;
        }
    }

    // Clear choices overlay if visible
    document.getElementById("pt-choices-overlay").classList.add("hidden");

    switch (cmd.type) {
        case "Say":
            const speakerName = getCharacterName(cmd.character);
            showPlaytestDialogue(speakerName, ptResolveText(cmd.text));
            break;

        case "Show":
            // Add or update shown character
            ptState.shownCharacters = ptState.shownCharacters.filter(c => c.id !== cmd.character);
            ptState.shownCharacters.push({
                id: cmd.character,
                position: cmd.position,
                emotion: cmd.emotion
            });
            drawPlaytestCharacters();
            logPtEvent(`Charakter ${cmd.character} angezeigt bei ${cmd.position} (${cmd.emotion})`);
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "Hide":
            ptState.shownCharacters = ptState.shownCharacters.filter(c => c.id !== cmd.character);
            drawPlaytestCharacters();
            logPtEvent(`Charakter ${cmd.character} ausgeblendet`);
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "Background":
            const bgElement = document.getElementById("pt-background");
            bgElement.className = "pt-background";
            bgElement.style.backgroundColor = "";
            bgElement.style.backgroundImage = "";

            // Use real image from asset store if available
            const bgUrl = assetStore.bgUrls[cmd.asset];
            if (bgUrl) {
                bgElement.style.backgroundImage = `url('${bgUrl}')`;
                bgElement.style.backgroundSize = "cover";
                bgElement.style.backgroundPosition = "center";
                logPtEvent(`Hintergrund geändert: ${cmd.asset}`);
                advancePlaytestIndex();
                runPlaytestCommand();
            } else {
                // Fallback attempt: relative path
                const bgInfo = assetStore.backgrounds.find(b => b.name === cmd.asset);
                const ext = bgInfo ? bgInfo.ext : "png";
                const fallbackUrl = `../assets/backgrounds/${cmd.asset}.${ext}`;

                const testImg = new Image();
                testImg.onload = () => {
                    bgElement.style.backgroundColor = "";
                    bgElement.style.backgroundImage = `url('${fallbackUrl}')`;
                    bgElement.style.backgroundSize = "cover";
                    bgElement.style.backgroundPosition = "center";
                    logPtEvent(`Hintergrund geändert: ${cmd.asset} (von relativem Pfad)`);
                    advancePlaytestIndex();
                    runPlaytestCommand();
                };
                testImg.onerror = () => {
                    bgElement.style.backgroundImage = "";
                    bgElement.style.backgroundColor = "hsl(30, 10%, 12%)";
                    logPtEvent(`Hintergrund geändert: ${cmd.asset} (nicht gefunden, Platzhalter gezeigt)`);
                    advancePlaytestIndex();
                    runPlaytestCommand();
                };
                testImg.src = fallbackUrl;
            }
            break;

        case "Choice":
            showPlaytestChoices(cmd.options);
            break;

        case "ModifyVariables":
            executeEffects(cmd.effects);
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "Jump":
            const targetScene = cmd.target_scene || ptState.currentSceneId;
            const targetIdx = resolveCommandIndex(targetScene, cmd.target_id, cmd.target_index || 0);
            logPtEvent(`Jump ausgeführt: ${targetScene} #${targetIdx}`, "system");

            ptState.currentSceneId = targetScene;
            ptState.currentIndex = targetIdx;
            runPlaytestCommand();
            break;

        case "PlayBgm":
            logPtEvent(`Audio BGM abgespielt: ${cmd.path}`, "info");
            stopAllPtAudio();
            if (cmd.path) {
                currentBgmAudio = new Audio('../assets/' + cmd.path);
                currentBgmAudio.loop = true;
                currentBgmAudio.play().catch(e => console.log("BGM playback blocked/failed:", e));
            }
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "PlaySfx":
            logPtEvent(`Audio SFX abgespielt: ${cmd.path}`, "info");
            if (cmd.path) {
                const sfx = new Audio('../assets/' + cmd.path);
                sfx.play().catch(e => console.log("SFX playback blocked/failed:", e));
            }
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "StopBgm":
            logPtEvent("Audio BGM angehalten");
            stopAllPtAudio();
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "ShakeWindow":
            logPtEvent(`Wackeleffekt ausgelöst (Stärke ${cmd.intensity}, ${cmd.duration_ms}ms)`);
            triggerScreenShake();
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "GlitchText":
            logPtEvent(`Glitcheffekt: ${cmd.duration}s`);
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "FakeError":
            logPtEvent(`Subversion FakeError ausgelöst: "${cmd.title}"`, "warning");
            triggerFakeErrorModal(cmd.title, cmd.message);
            advancePlaytestIndex();
            runPlaytestCommand();
            break;

        case "Branch":
            let chosenBranch = null;
            if (cmd.branches) {
                for (let i = 0; i < cmd.branches.length; i++) {
                    const branch = cmd.branches[i];
                    if (evaluateConditions(branch.conditions)) {
                        chosenBranch = branch;
                        break;
                    }
                }
            }
            if (chosenBranch) {
                const targetScene = chosenBranch.target_scene || ptState.currentSceneId;
                const targetIdx = resolveCommandIndex(targetScene, chosenBranch.target_id, chosenBranch.target_index || 0);
                logPtEvent(`Branch genommen: ${targetScene} #${targetIdx}`, "system");
                ptState.currentSceneId = targetScene;
                ptState.currentIndex = targetIdx;
            } else {
                logPtEvent("Branch: Keine Bedingungen erfüllt, Sequentieller Fallthrough", "info");
                advancePlaytestIndex();
            }
            runPlaytestCommand();
            break;
    }
}

function getCharacterName(charId) {
    if (!charId) return "";
    const char = project.characters.find(c => c.id === charId);
    return char ? char.name : charId;
}

function ptResolveText(textVal) {
    if (typeof textVal === 'object' && textVal !== null) {
        textVal = textVal[ptState.player_pronoun] || "";
    }
    if (typeof textVal !== 'string') {
        return "";
    }
    
    let resolved = textVal;
    let result = "";
    let i = 0;
    while (i < resolved.length) {
        if (resolved[i] === '$') {
            if (resolved[i + 1] === '$') {
                result += '$';
                i += 2;
            } else {
                let varId = "";
                let j = i + 1;
                while (j < resolved.length && (/[a-zA-Z0-9_]/).test(resolved[j])) {
                    varId += resolved[j];
                    j++;
                }
                if (varId.length > 0) {
                    const lowerVar = varId.toLowerCase();
                    if (lowerVar === "playername" || lowerVar === "player_name" || lowerVar === "name") {
                        result += ptState.player_name;
                    } else if (lowerVar === "playerpronoun" || lowerVar === "player_pronoun" || lowerVar === "pronoun") {
                        result += ptState.player_pronoun;
                    } else if (ptState.variables[varId] !== undefined) {
                        result += ptState.variables[varId];
                    } else if (ptState.affection[varId] !== undefined) {
                        result += ptState.affection[varId];
                    } else {
                        // Check case-insensitively
                        let found = false;
                        for (let k in ptState.variables) {
                            if (k.toLowerCase() === lowerVar) {
                                result += ptState.variables[k];
                                found = true;
                                break;
                            }
                        }
                        if (!found) {
                            for (let k in ptState.affection) {
                                if (k.toLowerCase() === lowerVar) {
                                    result += ptState.affection[k];
                                    found = true;
                                    break;
                                }
                            }
                        }
                        if (!found) {
                            // Check known flags/numbers
                            if (project.variables.flags.includes(varId)) {
                                result += "false";
                            } else if (project.variables.numbers[varId] !== undefined) {
                                result += "0";
                            } else {
                                // Keep it
                                result += "$" + varId;
                            }
                        }
                    }
                    i = j;
                } else {
                    result += '$';
                    i++;
                }
            }
        } else {
            result += resolved[i];
            i++;
        }
    }
    return result;
}

// Dialogue visual novel drawer with typing effect
function showPlaytestDialogue(speaker, text) {
    const box = document.getElementById("pt-textbox");
    box.classList.remove("hidden");

    const nameEl = document.getElementById("pt-char-name");
    if (speaker) {
        nameEl.classList.remove("hidden");
        nameEl.textContent = speaker;
        // Generate color from speaker name hash instead of hardcoding
        let hue = 35; // default warm hue
        for (let i = 0; i < speaker.length; i++) hue = (hue + speaker.charCodeAt(i) * 37) % 360;
        nameEl.style.backgroundColor = `hsl(${hue}, 40%, 45%)`;
    } else {
        nameEl.classList.add("hidden");
    }

    const textEl = document.getElementById("pt-text-content");
    textEl.innerHTML = "";

    if (ptState.typingInterval) clearInterval(ptState.typingInterval);

    if (ptState.isFastForward) {
        textEl.textContent = text;
    } else {
        let i = 0;
        ptState.typingInterval = setInterval(() => {
            textEl.textContent += text[i];
            i++;
            if (i >= text.length) {
                clearInterval(ptState.typingInterval);
                ptState.typingInterval = null;
            }
        }, 20); // 20ms per character
    }
}

function skipTypewriter() {
    clearInterval(ptState.typingInterval);
    ptState.typingInterval = null;
    const cmd = project.scenes[ptState.currentSceneId][ptState.currentIndex];
    if (cmd && cmd.type === "Say") {
        document.getElementById("pt-text-content").textContent = ptResolveText(cmd.text);
    }
}

function advancePlaytest() {
    if (ptState.typingInterval) {
        skipTypewriter();
    } else {
        // Only advance if we are not blocked by a Choice overlay
        const isChoice = project.scenes[ptState.currentSceneId][ptState.currentIndex]?.type === "Choice";
        if (!isChoice) {
            advancePlaytestIndex();
            runPlaytestCommand();
        }
    }
}

// Display Branching Choices
function showPlaytestChoices(options) {
    const overlay = document.getElementById("pt-choices-overlay");
    const container = document.getElementById("pt-choices-list");
    container.innerHTML = "";

    // Filter available choices based on conditions
    let visibleCount = 0;
    options.forEach((opt, idx) => {
        const meetsConditions = !opt.conditions || opt.conditions.length === 0 || evaluateConditions(opt.conditions);
        if (meetsConditions) {
            visibleCount++;
            const btn = document.createElement("button");
            btn.className = "pt-choice-btn";
            const resolvedText = ptResolveText(opt.text);
            btn.textContent = resolvedText;
            btn.addEventListener("click", () => {
                logPtEvent(`Entscheidung gewählt: "${resolvedText}"`);

                // Apply Effects
                if (opt.effects && opt.effects.length > 0) {
                    executeEffects(opt.effects);
                }

                // Relocate pointer
                const targetScene = opt.target_scene || ptState.currentSceneId;
                const targetIdx = resolveCommandIndex(targetScene, opt.target_id, opt.target_index || 0);
                ptState.currentSceneId = targetScene;
                ptState.currentIndex = targetIdx;

                overlay.classList.add("hidden");
                runPlaytestCommand();
            });
            container.appendChild(btn);
        }
    });

    if (visibleCount > 0) {
        overlay.classList.remove("hidden");
    } else {
        // Fallthrough if no options are visible
        logPtEvent("Warnung: Keine Choices erfüllen die Bedingungen! Automatisches Voranschreiten.", "warning");
        advancePlaytestIndex();
        runPlaytestCommand();
    }
}

// Conditions Evaluator
function evaluateConditions(conditions) {
    return conditions.every(c => {
        switch (c.type) {
            case "FlagSet":
                return ptState.variables[c.flag] === true;
            case "FlagNotSet":
                return ptState.variables[c.flag] !== true;
            case "MinAffection":
                return (ptState.affection[c.character] || 0) >= c.value;
            case "MaxAffection":
                return (ptState.affection[c.character] || 0) <= c.value;
            case "VarMin":
                return (ptState.variables[c.name] || 0) >= c.value;
            case "VarMax":
                return (ptState.variables[c.name] || 0) <= c.value;
            case "VarEquals":
                return (ptState.variables[c.name] || 0) === c.value;
            default:
                return true;
        }
    });
}

// Execute Variable Changes
function executeEffects(effects) {
    if (!effects) return;
    effects.forEach(eff => {
        switch (eff.type) {
            case "SetFlag":
                ptState.variables[eff.name] = eff.value;
                logPtEvent(`Flag "${eff.name}" gesetzt auf ${eff.value.toString().toUpperCase()}`, "effect");
                break;
            case "ChangeVar":
                ptState.variables[eff.name] = (ptState.variables[eff.name] || 0) + eff.delta;
                logPtEvent(`Variable "${eff.name}" verändert um ${eff.delta >= 0 ? '+' : ''}${eff.delta} (Neu: ${ptState.variables[eff.name]})`, "effect");
                break;
            case "SetVar":
                ptState.variables[eff.name] = eff.value;
                logPtEvent(`Variable "${eff.name}" festgelegt auf ${eff.value}`, "effect");
                break;
            case "ChangeAffection":
                ptState.affection[eff.character] = (ptState.affection[eff.character] || 0) + eff.delta;
                logPtEvent(`Beziehung zu ${eff.character} geändert um ${eff.delta >= 0 ? '+' : ''}${eff.delta} (Neu: ${ptState.affection[eff.character]})`, "effect");
                break;
        }
    });
    syncPlaytestDebugger();
}

// Interactive Subversion Shaking
function triggerScreenShake() {
    const vp = document.getElementById("playtest-viewport");
    vp.classList.remove("shake-viewport");
    // Trigger redraw
    void vp.offsetWidth;
    vp.classList.add("shake-viewport");
    setTimeout(() => {
        vp.classList.remove("shake-viewport");
    }, 450);
}

// Interactive Subversion Fake Error Modal
function triggerFakeErrorModal(title, msg) {
    document.getElementById("fake-error-title").textContent = title || "Fatal Error";
    document.getElementById("fake-error-msg").textContent = msg || "Grug.chr wurde unerwartet beendet.";
    document.getElementById("fake-error-modal").classList.remove("hidden");
}


// --- Helper Functions ---
function syncAllUI() {
    syncScenesList();
    syncStartSceneSelector();
    renderFlagsList();
    renderNumbersList();
    renderCharactersList();
    renderPlayerVariables();
    selectScene(currentSceneId);
}

window.updatePlayerName = function(val) {
    if (!project.player_variables) project.player_variables = {};
    project.player_variables.name = val || "Spieler";
    saveToLocalStorage();
};

window.updatePlayerPronoun = function(val) {
    if (!project.player_variables) project.player_variables = {};
    project.player_variables.pronoun = val || "Er";
    saveToLocalStorage();
};

function renderPlayerVariables() {
    if (!project.player_variables) {
        project.player_variables = {
            name: "Spieler",
            pronoun: "Er"
        };
    }
    const nameInput = document.getElementById("input-player-name");
    const pronounSelect = document.getElementById("select-player-pronoun");
    if (nameInput) nameInput.value = project.player_variables.name;
    if (pronounSelect) pronounSelect.value = project.player_variables.pronoun;
}

function getPreviewText(textVal) {
    if (typeof textVal === 'object' && textVal !== null) {
        return `[Er: ${textVal.Er || ""}, Sie: ${textVal.Sie || ""}, Dey: ${textVal.Dey || ""}]`;
    }
    return textVal || "";
}

function renderDynamicTextField(label, value, cmdIdx, subIdx = null) {
    const isObj = typeof value === 'object' && value !== null;
    const erText = isObj ? (value.Er || "") : "";
    const sieText = isObj ? (value.Sie || "") : "";
    const deyText = isObj ? (value.Dey || "") : "";
    const simpleText = isObj ? "" : (value || "");

    const changeToggleCode = subIdx !== null 
        ? `togglePronounTextChoice(${cmdIdx}, ${subIdx}, this.checked)`
        : `togglePronounTextSay(${cmdIdx}, this.checked)`;

    const changeSimpleCode = subIdx !== null
        ? `updateChoiceOptionText(${cmdIdx}, ${subIdx}, this.value)`
        : `updateCmdField(${cmdIdx}, 'text', this.value)`;

    const changeErCode = subIdx !== null
        ? `updateChoiceOptionTextPronoun(${cmdIdx}, ${subIdx}, 'Er', this.value)`
        : `updateCmdFieldPronoun(${cmdIdx}, 'Er', this.value)`;

    const changeSieCode = subIdx !== null
        ? `updateChoiceOptionTextPronoun(${cmdIdx}, ${subIdx}, 'Sie', this.value)`
        : `updateCmdFieldPronoun(${cmdIdx}, 'Sie', this.value)`;

    const changeDeyCode = subIdx !== null
        ? `updateChoiceOptionTextPronoun(${cmdIdx}, ${subIdx}, 'Dey', this.value)`
        : `updateCmdFieldPronoun(${cmdIdx}, 'Dey', this.value)`;

    return `
        <div class="dynamic-text-field" style="margin-bottom:8px; width: 100%; display: flex; flex-direction: column; gap: 6px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <label style="font-weight: bold; font-size: 11px;">${label}</label>
                <label style="font-size:11px; display:inline-flex; align-items:center; gap:4px; font-weight:normal; cursor:pointer;">
                    <input type="checkbox" ${isObj ? 'checked' : ''} onchange="${changeToggleCode}">
                    Pronomenabhängig 🎭
                </label>
            </div>
            ${isObj ? `
                <div class="pronoun-fields-container" style="display:flex; flex-direction:column; gap:8px; width: 100%;">
                    <div style="width: 100%;">
                        <span style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px; font-weight:bold;">Er/Ihn</span>
                        <textarea class="input-textarea" rows="2" style="font-size:12px; min-height:45px; width:100%; box-sizing:border-box;" onchange="${changeErCode}">${escapeHtml(erText)}</textarea>
                    </div>
                    <div style="width: 100%;">
                        <span style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px; font-weight:bold;">Sie/Ihr</span>
                        <textarea class="input-textarea" rows="2" style="font-size:12px; min-height:45px; width:100%; box-sizing:border-box;" onchange="${changeSieCode}">${escapeHtml(sieText)}</textarea>
                    </div>
                    <div style="width: 100%;">
                        <span style="font-size:11px; color:var(--text-muted); display:block; margin-bottom:2px; font-weight:bold;">Dey/Deren</span>
                        <textarea class="input-textarea" rows="2" style="font-size:12px; min-height:45px; width:100%; box-sizing:border-box;" onchange="${changeDeyCode}">${escapeHtml(deyText)}</textarea>
                    </div>
                </div>
            ` : `
                <textarea class="input-textarea" rows="2" style="width:100%; box-sizing:border-box;" onchange="${changeSimpleCode}">${escapeHtml(simpleText)}</textarea>
            `}
        </div>
    `;
}

window.togglePronounTextSay = function(cmdIdx, checked) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    if (checked) {
        const oldText = typeof cmd.text === 'string' ? cmd.text : "";
        cmd.text = {
            Er: oldText,
            Sie: oldText,
            Dey: oldText
        };
    } else {
        cmd.text = typeof cmd.text === 'object' && cmd.text !== null ? (cmd.text.Er || "") : "";
    }
    renderCommands();
    saveToLocalStorage();
};

window.togglePronounTextChoice = function(cmdIdx, optIdx, checked) {
    const opt = project.scenes[currentSceneId][cmdIdx].options[optIdx];
    if (checked) {
        const oldText = typeof opt.text === 'string' ? opt.text : "";
        opt.text = {
            Er: oldText,
            Sie: oldText,
            Dey: oldText
        };
    } else {
        opt.text = typeof opt.text === 'object' && opt.text !== null ? (opt.text.Er || "") : "";
    }
    renderCommands();
    saveToLocalStorage();
};

window.updateCmdFieldPronoun = function(cmdIdx, pronounKey, val) {
    const cmd = project.scenes[currentSceneId][cmdIdx];
    if (typeof cmd.text !== 'object' || cmd.text === null) {
        cmd.text = { Er: "", Sie: "", Dey: "" };
    }
    cmd.text[pronounKey] = val;
    const previewEl = document.getElementById(`node-preview-${cmdIdx}`);
    if (previewEl) {
        previewEl.textContent = getNodePreviewText(cmd);
    }
    saveToLocalStorage();
};

window.updateChoiceOptionText = function(cmdIdx, optIdx, val) {
    project.scenes[currentSceneId][cmdIdx].options[optIdx].text = val;
    saveToLocalStorage();
};

window.updateChoiceOptionTextPronoun = function(cmdIdx, optIdx, pronounKey, val) {
    const opt = project.scenes[currentSceneId][cmdIdx].options[optIdx];
    if (typeof opt.text !== 'object' || opt.text === null) {
        opt.text = { Er: "", Sie: "", Dey: "" };
    }
    opt.text[pronounKey] = val;
    saveToLocalStorage();
};

function escapeHtml(text) {
    if (!text) return "";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- Load Pre-configured Kambrium Dating Sim Story ---
function loadDemoProject() {
    project = {
        start_scene: "Prolog: Die Tiefseegrotte",
        characters: [
            { id: "grug", name: "Grug" },
            { id: "una", name: "Una" },
            { id: "flint", name: "Flint" }
        ],
        variables: {
            flags: ["grotte_erkundet", "hat_trilobiten_snack", "una_gluecklich"],
            numbers: {
                trilobite_shells_count: 0
            }
        },
        player_variables: {
            name: "Spieler",
            pronoun: "Er"
        },
        scenes: {
            "Prolog: Die Tiefseegrotte": [
                {
                    type: "Background",
                    asset: "cave"
                },
                {
                    type: "Say",
                    character: "",
                    text: "Du erwachst in einer schlammigen Grotte am Meeresgrund des Kambriums. Das fluoreszierende Leuchten urzeitlicher Algen wirft sanfte Schatten an die Felswände..."
                },
                {
                    type: "Show",
                    character: "grug",
                    position: "Center",
                    emotion: "neutral",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "grug",
                    text: "Blub! Du wach! Grug dachte, du für immer in Schlamm versinken.",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "grug",
                    text: "Draußen gefährlich. Riesen-Anomalocaris kreist. Aber Grug beschützt.",
                    conditions: []
                },
                {
                    type: "Choice",
                    options: [
                        {
                            text: "Danke, Grug! Du bist sehr mutig.",
                            target_scene: null,
                            target_index: 6,
                            effects: [
                                { type: "ChangeAffection", character: "grug", delta: 3 }
                            ],
                            conditions: []
                        },
                        {
                            text: "*Verwirrt umschauen*",
                            target_scene: null,
                            target_index: 9,
                            effects: [
                                { type: "SetFlag", name: "grotte_erkundet", value: true }
                            ],
                            conditions: []
                        },
                        {
                            text: "Ich kann mich selbst beschützen!",
                            target_scene: null,
                            target_index: 13,
                            effects: [
                                { type: "ChangeAffection", character: "grug", delta: -1 }
                            ],
                            conditions: []
                        }
                    ]
                },
                // Branch A (Positive Grug) - index 6
                {
                    type: "Say",
                    character: "grug",
                    text: "*wird rot* G-Grug nur tut was Grug tun muss...",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "",
                    text: "Grug wackelt verlegen mit seinen Fühlern und gräbt im Sand.",
                    conditions: []
                },
                {
                    type: "Jump",
                    target_scene: "Treffen mit Una",
                    target_index: 0,
                    conditions: []
                },
                // Branch B (Neutral Search) - index 9
                {
                    type: "Say",
                    character: "",
                    text: "Du schaust dich um. Die Grotte ist warm und weicher Sand bedeckt den Boden. Ein paar alte Trilobiten-Panzer liegen in der Ecke.",
                    conditions: []
                },
                {
                    type: "ModifyVariables",
                    effects: [
                        { type: "ChangeVar", name: "trilobite_shells_count", delta: 2 }
                    ]
                },
                {
                    type: "Say",
                    character: "grug",
                    text: "Hier sicher. Grug hat Essen gemacht. Trilobiten-Steak!",
                    conditions: []
                },
                {
                    type: "Jump",
                    target_scene: "Treffen mit Una",
                    target_index: 0,
                    conditions: []
                },
                // Branch C (Negative Grug) - index 13
                {
                    type: "Say",
                    character: "grug",
                    text: "O-Oh... Grug versteht. Du stark.",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "",
                    text: "Grug wackelt traurig mit den Schwimmbeinen und schwimmt einen Schritt zurück.",
                    conditions: []
                },
                {
                    type: "Jump",
                    target_scene: "Treffen mit Una",
                    target_index: 0,
                    conditions: []
                }
            ],
            "Treffen mit Una": [
                {
                    type: "Background",
                    asset: "forest"
                },
                {
                    type: "Say",
                    character: "",
                    text: "Später wanderst du durch einen dichten Algenwald...",
                    conditions: []
                },
                {
                    type: "Show",
                    character: "una",
                    position: "Left",
                    emotion: "angry",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "una",
                    text: "Halt! Wer da? Fremde im Revier von Una!",
                    conditions: []
                },
                {
                    type: "Choice",
                    options: [
                        {
                            text: "Ich suche Grugs Grotte. Ich will keinen Ärger.",
                            target_scene: null,
                            target_index: 4,
                            effects: [],
                            conditions: []
                        },
                        {
                            text: "Hier, ich habe Panzerplatten gefunden! (Benötigt Trilobiten-Panzer)",
                            target_scene: null,
                            target_index: 7,
                            effects: [
                                { type: "ChangeAffection", character: "una", delta: 4 },
                                { type: "ChangeVar", name: "trilobite_shells_count", delta: -2 }
                            ],
                            conditions: [
                                { type: "VarMin", name: "trilobite_shells_count", value: 2 }
                            ]
                        }
                    ]
                },
                // Option A: Talk - index 4
                {
                    type: "Say",
                    character: "una",
                    text: "Grug? Der große Tollpatsch? Na gut, du scheinst harmlos zu sein.",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "una",
                    text: "Aber behalte das Freiwasser im Auge. Große Anomalocaris jagen heute.",
                    conditions: []
                },
                {
                    type: "Jump",
                    target_scene: "Finale",
                    target_index: 0,
                    conditions: []
                },
                // Option B: Give Tools - index 7
                {
                    type: "Say",
                    character: "una",
                    text: "Oh! Schöne Trilobiten-Panzer! Una glücklich. Damit kann ich meinen Schild verstärken.",
                    conditions: []
                },
                {
                    type: "ModifyVariables",
                    effects: [
                        { type: "SetFlag", name: "una_gluecklich", value: true }
                    ]
                },
                {
                    type: "Show",
                    character: "una",
                    position: "Left",
                    emotion: "happy",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "una",
                    text: "Komm mit mir zum Tiefseegraben. Dort gibt es frisches Plankton!",
                    conditions: []
                },
                {
                    type: "Jump",
                    target_scene: "Finale",
                    target_index: 0,
                    conditions: []
                }
            ],
            "Finale": [
                {
                    type: "Background",
                    asset: "river",
                    conditions: []
                },
                {
                    type: "Say",
                    character: "",
                    text: "Du erreichst den Tiefseegraben. Bläschen steigen im Licht der Sonne empor.",
                    conditions: []
                },
                // Conditional dialogues based on choices made!
                {
                    type: "Show",
                    character: "una",
                    position: "Left",
                    emotion: "happy",
                    conditions: [
                        { type: "FlagSet", flag: "una_gluecklich" }
                    ]
                },
                {
                    type: "Say",
                    character: "una",
                    text: "Der Tiefseegraben ist heute wunderschön. Danke für deine Hilfe!",
                    conditions: [
                        { type: "FlagSet", flag: "una_gluecklich" }
                    ]
                },
                {
                    type: "Show",
                    character: "grug",
                    position: "Right",
                    emotion: "happy",
                    conditions: [
                        { type: "MinAffection", character: "grug", value: 3 }
                    ]
                },
                {
                    type: "Say",
                    character: "grug",
                    text: "Grug freut sich, dich gesund zu sehen!",
                    conditions: [
                        { type: "MinAffection", character: "grug", value: 3 }
                    ]
                },
                {
                    type: "Say",
                    character: "",
                    text: "Hier endet deine Geschichte für heute. Du hast überlebt und neue Gefährten im Kambrium-Meer gefunden!",
                    conditions: []
                },
                // Let's test window shaking and fake error triggers at the very end
                {
                    type: "ShakeWindow",
                    intensity: 15.0,
                    duration_ms: 500
                },
                {
                    type: "FakeError",
                    title: "Kambrium Dating Sim",
                    message: "Simulation erfolgreich abgeschlossen. Bitte starte den Client."
                }
            ]
        }
    };
    currentSceneId = "Prolog: Die Tiefseegrotte";
}

// --- Keyboard Shortcuts ---
function initKeyboardShortcuts() {
    document.addEventListener("keydown", (e) => {
        // Ctrl+S: Export JSON
        if ((e.ctrlKey || e.metaKey) && e.key === "s") {
            e.preventDefault();
            document.getElementById("btn-export").click();
            showToast("✅ JSON exportiert!");
        }
    });
}

function showToast(message) {
    // Remove existing toast if any
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2200);
}

// --- Sidebar Toggle ---
function initSidebarToggle() {
    const toggleBtn = document.getElementById("btn-sidebar-toggle");
    const sidebar = document.getElementById("app-sidebar");

    if (!toggleBtn || !sidebar) return;

    toggleBtn.addEventListener("click", () => {
        const isCollapsed = sidebar.classList.toggle("collapsed");
        toggleBtn.textContent = isCollapsed ? "▶" : "◀";
        toggleBtn.title = isCollapsed ? "Sidebar einblenden" : "Sidebar ausblenden";

        // Redraw after CSS transition finishes
        setTimeout(() => {
            if (currentTab === "script") {
                drawScriptGraphEdges();
            }
        }, 320);
    });
}
