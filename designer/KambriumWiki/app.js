document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  const tabButtons = document.querySelectorAll('.nav-item button');
  const pageContainers = document.querySelectorAll('.page-container');
  const searchInput = document.getElementById('wiki-search');
  const searchResultsOverlay = document.getElementById('search-results');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const sidebar = document.querySelector('aside.sidebar');
  
  const overviewTab = document.getElementById('page-overview');
  const floraTab = document.getElementById('page-flora');
  const faunaTab = document.getElementById('page-fauna');
  const geographyTab = document.getElementById('page-geography');

  // Modal elements
  const speciesModal = document.getElementById('species-modal');
  const modalClose = document.getElementById('modal-close');
  const modalTitle = document.getElementById('modal-title');
  const modalSubtitle = document.getElementById('modal-subtitle');
  const modalWikiContent = document.getElementById('modal-wiki-content');
  const modalGoogleLink = document.getElementById('modal-google-link');

  // --- State Variables ---
  let activeTab = 'overview';
  let activeFloraFilter = 'all';
  let activeFaunaFilter = 'all';

  // --- Initialization ---
  renderAll();
  setupEventListeners();

  // --- Render Functions ---
  function renderAll() {
    renderOverview();
    renderFlora();
    renderFauna();
    renderGeography();
  }

  // 1. Overview Tab Rendering
  function renderOverview() {
    const data = KambriumWikiData.overview;
    const extinctions = KambriumWikiData.massExtinctions;

    let html = `
      <p class="intro-text">${data.introduction}</p>
      
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">Äon</div>
          <div class="stat-value" style="font-size: 15px;">${data.eon}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Ära</div>
          <div class="stat-value" style="font-size: 15px;">${data.era}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Zeitraum</div>
          <div class="stat-value" style="font-size: 15px;">${data.period}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">Dauer</div>
          <div class="stat-value" style="font-size: 15px;">${data.duration}</div>
        </div>
      </div>

      <!-- Klima & Atmosphäre Section -->
      <h2 class="section-title">${data.klima.title}</h2>
      <div class="glass-card" style="margin-bottom: 40px;" id="overview-climate">
        <p class="intro-text" style="margin-bottom: 20px; max-width: 100%;">${data.klima.text}</p>
        <div class="grid-3col" style="margin-bottom: 0; gap: 16px;">
          ${data.klima.stats.map(s => `
            <div style="padding: 16px; background: rgba(6, 182, 212, 0.03); border: 1px solid rgba(6, 182, 212, 0.1); border-radius: 10px; text-align: center;">
              <div style="font-size: 10px; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.5px; margin-bottom: 6px; font-weight:600;">${s.label}</div>
              <div style="font-family: 'Outfit'; font-size: 17px; font-weight: 600; color: var(--color-accent); margin-bottom: 4px;">${s.value}</div>
              <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.3;">${s.sub}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <h2 class="section-title">Epochengrenzen</h2>
      <div class="boundary-container">
        <div class="glass-card boundary-card start">
          <div class="hero-badge">${data.markers.start.age}</div>
          <h3>${data.markers.start.event}</h3>
          <p class="timeline-desc">${data.markers.start.marker}</p>
        </div>
        <div class="glass-card boundary-card end">
          <div class="hero-badge">${data.markers.end.age}</div>
          <h3>${data.markers.end.event}</h3>
          <p class="timeline-desc">${data.markers.end.marker}</p>
        </div>
      </div>

      <!-- Namensherkunft & Unterteilung Grid -->
      <div class="grid-2col" style="margin-bottom: 40px;">
        <div class="glass-card" id="overview-subdivisions">
          <h3 style="font-family:'Outfit'; font-size:20px; color:#fff; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">${data.subdivisions.title}</h3>
          <p style="font-size: 13.5px; color: var(--text-secondary); margin-bottom: 16px; line-height: 1.6;">${data.subdivisions.text}</p>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${data.subdivisions.series.map(s => `
              <div style="padding: 8px 12px; background: rgba(255,255,255,0.01); border: 1px solid rgba(255,255,255,0.03); border-radius: 8px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
                <span style="color: var(--color-accent); font-family: 'Outfit'; font-size: 13px; font-weight:600;">${s.name}</span>
                <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                  ${s.stages.map(st => `<span style="font-size: 10px; background: rgba(6, 182, 212, 0.08); border: 1px solid rgba(6, 182, 212, 0.15); padding: 1px 6px; border-radius: 4px; color: var(--text-primary); font-weight:500;">${st}</span>`).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="glass-card" id="overview-naming" style="display:flex; flex-direction:column; justify-content:flex-start;">
          <h3 style="font-family:'Outfit'; font-size:20px; color:#fff; margin-bottom:12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">${data.namensherkunft.title}</h3>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7; flex-grow:1;">${data.namensherkunft.text}</p>
          <div style="margin-top:20px; padding: 12px; background:rgba(255,255,255,0.02); border-radius:8px; border-left: 3px solid var(--color-accent); font-size:12px; color:var(--text-muted);">
            Adam Sedgwick prägte den Begriff im frühen 19. Jahrhundert nach dem lateinischen Wort für Wales: <em>Cambria</em>.
          </div>
        </div>
      </div>

      <h2 class="section-title">Wichtige Leitfossilien</h2>
      <div class="grid-2col">
        ${data.leitfossilien.map(lf => `
          <div class="glass-card" id="lf-${lf.name.replace(/\s+/g, '-').toLowerCase()}">
            <span class="badge leitfossil" style="display: inline-block; margin-bottom: 8px;">Leitfossil</span>
            <h3 style="font-family: 'Outfit', sans-serif; font-size: 20px; color:#fff; margin-bottom: 4px;">${lf.name}</h3>
            <p style="font-size: 13px; font-style: italic; color: var(--color-accent); margin-bottom: 12px;">${lf.type}</p>
            <p style="font-size: 14px; color: var(--text-secondary);">${lf.description}</p>
          </div>
        `).join('')}
      </div>

      <h2 class="section-title">Chronologie der Hauptereignisse</h2>
      <div class="timeline-container">
        ${data.keyEvents.map(event => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-title">${event.name}</div>
            <div class="timeline-desc">${event.description}</div>
          </div>
        `).join('')}
      </div>

      <h2 class="section-title">${extinctions.title}</h2>
      <p class="intro-text">${extinctions.intro}</p>
      <div class="grid-3col">
        ${extinctions.events.slice(0, 2).map(event => `
          <div class="glass-card extinction-card" id="extinction-${event.name.replace(/\s+/g, '-').toLowerCase()}">
            <div class="extinction-header">
              <h3>${event.name}</h3>
              <span class="extinction-rate">${event.rate}</span>
            </div>
            <div class="age">${event.age}</div>
            <p style="font-size: 14px; color: var(--text-secondary);">${event.description}</p>
          </div>
        `).join('')}
      </div>

      <div class="glass-card extinction-card" style="margin-bottom: 40px;" id="extinction-kambro-ordovizisch">
        <div class="extinction-header">
          <h3 style="font-size: 22px;">${extinctions.events[2].name}</h3>
          <span class="extinction-rate" style="font-size: 14px; padding: 6px 12px;">${extinctions.events[2].rate}</span>
        </div>
        <div class="age" style="margin-bottom: 16px;">${extinctions.events[2].age}</div>
        <p class="intro-text" style="margin-bottom: 24px;">${extinctions.events[2].description}</p>
        
        <div class="hypotheses-list">
          ${extinctions.events[2].hypotheses.map(hyp => `
            <div class="hypothesis-item">
              <h4>${hyp.title}</h4>
              <p>${hyp.detail}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    overviewTab.innerHTML = html;
  }

  // 2. Flora Tab Rendering
  function renderFlora() {
    const data = KambriumWikiData.flora;
    const species = data.species;

    // Filters UI
    let filterHtml = `
      <div class="filter-bar">
        <button class="filter-btn ${activeFloraFilter === 'all' ? 'active' : ''}" data-filter="all">Alle Flora</button>
        <button class="filter-btn ${activeFloraFilter === 'Planktonisch' ? 'active' : ''}" data-filter="Planktonisch">Planktonisch (Schwebend)</button>
        <button class="filter-btn ${activeFloraFilter === 'Benthisch' ? 'active' : ''}" data-filter="Benthisch">Benthisch (Meeresboden)</button>
      </div>
    `;

    // Filter species
    const filtered = species.filter(s => {
      if (activeFloraFilter === 'all') return true;
      if (activeFloraFilter === 'Planktonisch') return s.lifestyle.includes('Planktonisch');
      if (activeFloraFilter === 'Benthisch') return s.lifestyle.includes('Benthisch');
      return true;
    });

    // Species Grid
    let gridHtml = `
      <div class="grid-2col" style="margin-bottom: 40px;">
        ${filtered.map(s => `
          <div class="glass-card species-card" id="flora-${s.name.replace(/\s+/g, '-').toLowerCase()}">
            <div class="species-header">
              <div class="species-meta">
                <h3 class="species-title">${s.name}</h3>
                <div class="species-badges">
                  <span class="badge category">${s.category}</span>
                  <span class="badge lifestyle">${s.lifestyle}</span>
                </div>
                <button class="species-info-btn" data-scientific="${s.scientific}" data-name="${s.name}" title="Bildsuche & Details">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
              </div>
              <div class="species-scientific">${s.scientific}</div>
              <p class="species-desc">${s.description}</p>
            </div>
            
            <div class="species-footer">
              Status: <span>${s.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
      
      <!-- Visual Illustration for Flora -->
      <div class="glass-card map-card" style="margin-bottom: 40px;">
        <div class="map-image-container">
          <img src="images/phytoplankton.png" alt="Phytoplankton" class="map-image">
          <div class="map-overlay-title">Biolumineszentes Phytoplankton (Modellierung)</div>
        </div>
        <div class="map-details">
          <span class="hero-badge">Urozean-Ökologie</span>
          <h3>Die Lunge des Kambriums</h3>
          <p>
            Obwohl einzellig und mikroskopisch klein, war das marine Phytoplankton die wichtigste treibende Kraft des atmosphärischen Sauerstoffanstiegs. Seine biologische Aktivität kurbelte die Evolution der Metazoen (Tiere) an, indem es als riesiger Kohlenstoffdioxid-Puffer und globale Nahrungsquelle diente.
          </p>
        </div>
      </div>
    `;

    floraTab.innerHTML = `
      <p class="intro-text">${data.intro}</p>
      ${filterHtml}
      ${gridHtml}
    `;

    // Attach filters event listeners
    floraTab.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeFloraFilter = e.target.getAttribute('data-filter');
        renderFlora();
      });
    });
  }

  // 3. Fauna Tab Rendering
  function renderFauna() {
    const data = KambriumWikiData.fauna;
    const species = data.species;

    // Filters UI
    let filterHtml = `
      <div class="filter-bar" style="margin-bottom: 28px;">
        <button class="filter-btn ${activeFaunaFilter === 'all' ? 'active' : ''}" data-filter="all">Alle Tierarten</button>
        <button class="filter-btn ${activeFaunaFilter === 'arthropoda' ? 'active' : ''}" data-filter="arthropoda">Gliederfüßer</button>
        <button class="filter-btn ${activeFaunaFilter === 'lobopodia' ? 'active' : ''}" data-filter="lobopodia">Lobopoden & Häutungstiere</button>
        <button class="filter-btn ${activeFaunaFilter === 'chordata' ? 'active' : ''}" data-filter="chordata">Chordatiere (Wirbeltiere)</button>
        <button class="filter-btn ${activeFaunaFilter === 'invertebrata' ? 'active' : ''}" data-filter="invertebrata">Sonstige Wirbellose</button>
        <button class="filter-btn ${activeFaunaFilter === 'incertae' ? 'active' : ''}" data-filter="incertae">Rätselhafte</button>
      </div>
    `;

    // Filter species
    const filtered = species.filter(s => {
      if (activeFaunaFilter === 'all') return true;
      return s.category === activeFaunaFilter;
    });

    // Species Grid
    let gridHtml = `
      <div class="grid-3col">
        ${filtered.map(s => `
          <div class="glass-card species-card" id="fauna-${s.name.replace(/\s+/g, '-').toLowerCase()}">
            <div class="species-header">
              <div class="species-meta">
                <h3 class="species-title">${s.name}</h3>
                <div class="species-badges">
                  ${s.isLeitfossil ? '<span class="badge leitfossil">Leitfossil</span>' : ''}
                  <span class="badge lifestyle" style="${s.lifestyle.includes('Nektonisch') ? 'background:rgba(59,130,246,0.1); border-color:rgba(59,130,246,0.25); color:#60a5fa;' : ''}">${s.lifestyle}</span>
                </div>
                <button class="species-info-btn" data-scientific="${s.scientific}" data-name="${s.name}" title="Bildsuche & Details">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </button>
              </div>
              <div class="species-scientific">${s.scientific}</div>
              <p class="species-desc">${s.description}</p>
            </div>
            
            <div class="species-footer">
              Klasse: <span>${s.subCategory}</span><br>
              Status: <span style="color: var(--color-danger);">${s.status}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    // Specific highlight card (Trilobiten Fossil)
    let extraVisualHtml = '';
    if (activeFaunaFilter === 'all' || activeFaunaFilter === 'arthropoda') {
      extraVisualHtml = `
        <h2 class="section-title" style="margin-top: 40px;">Fossiler Fundbericht: Trilobiten</h2>
        <div class="glass-card map-card" style="margin-bottom: 40px;">
          <div class="map-image-container">
            <img src="images/trilobite.png" alt="Trilobite Fossil" class="map-image">
            <div class="map-overlay-title">Paradoxides Fossilien-Rekonstruktion</div>
          </div>
          <div class="map-details">
            <span class="hero-badge">Leitfossil</span>
            <h3>Die Herrscher des Meeresbodens</h3>
            <p>
              Aufgrund ihres strapazierfähigen Chitinpanzers versteinerten Trilobiten in unzähligen Schichten. Sie entwickelten komplexe Facettenaugen (aus Calcit-Linsen) und waren perfekt an das Leben als Bodenräuber oder Detritusfresser angepasst. Ihre globale Verbreitung macht sie zu erstklassigen Werkzeugen für Paläontologen weltweit.
            </p>
          </div>
        </div>
      `;
    }

    faunaTab.innerHTML = `
      <p class="intro-text">${data.intro}</p>
      ${filterHtml}
      ${gridHtml}
      ${extraVisualHtml}
    `;

    // Attach filters event listeners
    faunaTab.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeFaunaFilter = e.target.getAttribute('data-filter');
        renderFauna();
      });
    });
  }

  // 4. Geography & Biomes Tab Rendering
  function renderGeography() {
    const data = KambriumWikiData.geography;
    const biomes = KambriumWikiData.biomes;

    let html = `
      <p class="intro-text">${data.intro}</p>
      
      <!-- Interactive Continent Section -->
      <div class="glass-card map-card" style="margin-bottom: 40px;">
        <div class="map-image-container">
          <img src="${data.mapUrl}" alt="Kambrium Weltkarte" class="map-image">
          <div class="map-overlay-title">Weltkarte des Kambriums (Tektonik)</div>
        </div>
        <div class="map-details">
          <span class="hero-badge">Tektonik</span>
          <h3>Plattentektonik</h3>
          <p>
            Im Kambrium existierten mehrere kleine Kontinentalplatten, die meist um den Äquator gruppiert waren. Ihre Aufspaltung führte zu vermehrter vulkanischer Aktivität, was wiederum das Klima erwärmte und den Meeresspiegel steigen ließ (Transgression). Dies schuf weite Flachwasserschelfe.
          </p>
        </div>
      </div>

      <div class="grid-2col" style="margin-bottom: 40px;">
        <div>
          <h2 class="section-title">Kontinente & Terrane</h2>
          <div class="accordion-list">
            ${data.continents.map((c, i) => `
              <div class="accordion-item" id="continent-${c.name.replace(/\s+/g, '-').toLowerCase()}">
                <button class="accordion-header">
                  <span>${c.name}</span>
                  <svg class="accordion-icon" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div class="accordion-content">
                  <div class="accordion-content-inner">
                    <p>${c.description}</p>
                    <div class="continent-features">
                      ${c.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <div>
          <h2 class="section-title">Ozeane des Urmeers</h2>
          <div class="accordion-list">
            ${data.oceans.map((o, i) => `
              <div class="accordion-item" id="ocean-${o.name.split(' ')[0].replace(/\s+/g, '-').toLowerCase()}">
                <button class="accordion-header">
                  <span>${o.name}</span>
                  <svg class="accordion-icon" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                <div class="accordion-content">
                  <div class="accordion-content-inner">
                    <p>${o.description}</p>
                  </div>
                </div>
              </div>
            `).join('')}
      </div>

      <!-- Sedimente und Vorkommen -->
      <div class="grid-2col" style="margin-bottom: 40px;">
        <div class="glass-card" id="geography-sediments">
          <h3 style="font-family: 'Outfit'; font-size: 20px; color:#fff; margin-bottom: 12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">${data.sedimente.title}</h3>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.7;">${data.sedimente.text}</p>
        </div>
        
        <div class="glass-card" id="geography-occurrence">
          <h3 style="font-family: 'Outfit'; font-size: 20px; color:#fff; margin-bottom: 12px; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:8px;">${data.vorkommen.title}</h3>
          <div style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; display:flex; flex-direction:column; gap:12px;">
            <div>
              <strong style="color:var(--color-accent);">Mitteleuropa / Deutschland:</strong>
              <p style="margin-top:2px;">${data.vorkommen.deutschland}</p>
            </div>
            <div>
              <strong style="color:var(--color-accent);">Global (Burgess Shale & Maotianshan):</strong>
              <p style="margin-top:2px;">${data.vorkommen.global}</p>
            </div>
          </div>
        </div>
      </div>

      <h2 class="section-title">${biomes.title}</h2>
      <p class="intro-text">${biomes.intro}</p>
      
      <div class="grid-3col">
        ${biomes.list.map(b => `
          <div class="glass-card biome-card" id="biome-${b.name.replace(/\s+/g, '-').toLowerCase()}">
            <h3>
              <span>${b.name}</span>
              <span class="biome-conditions">${b.conditions}</span>
            </h3>
            <p class="biome-desc">${b.description}</p>
            <div class="biome-residents-title">Typische Bewohner</div>
            <div class="biome-residents">
              ${b.residents.map(r => `<span class="biome-resident-tag">${r}</span>`).join('')}
            </div>
          </div>
        `).join('')}
      </div>

      <div class="highlight-section" style="margin-bottom: 40px;" id="biome-agronomische-revolution">
        <h3>${biomes.agronomischeRevolution.title}</h3>
        <p>${biomes.agronomischeRevolution.description}</p>
      </div>
    `;

    geographyTab.innerHTML = html;

    // Attach accordion listeners
    const accordions = geographyTab.querySelectorAll('.accordion-header');
    accordions.forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        const content = item.querySelector('.accordion-content');
        
        // Toggle current
        if (item.classList.contains('open')) {
          item.classList.remove('open');
          content.style.maxHeight = null;
        } else {
          item.classList.add('open');
          content.style.maxHeight = content.scrollHeight + 'px';
        }
      });
    });
  }

  // --- Fuzzy Search Logic ---
  // A lightweight fuzzy scorer that measures how closely query matches text.
  // Returns: { score: number, matches: array of indices }
  function fuzzyMatch(text, query) {
    const textNorm = text.toLowerCase();
    const queryNorm = query.toLowerCase();
    
    // 1. Exact match
    if (textNorm === queryNorm) return { score: 100 };
    
    // 2. Contains exact query
    const idx = textNorm.indexOf(queryNorm);
    if (idx !== -1) {
      // Prioritize start-of-word matches
      const score = idx === 0 || textNorm[idx - 1] === ' ' ? 80 : 50;
      return { score: score };
    }

    // 3. Substring of characters (fuzzy sequence match, allows typos)
    let score = 0;
    let queryIdx = 0;
    let lastMatchIdx = -1;
    let matchSequenceCount = 0;

    for (let i = 0; i < textNorm.length; i++) {
      if (textNorm[i] === queryNorm[queryIdx]) {
        score += 5; // Base point for character match
        if (lastMatchIdx !== -1 && i === lastMatchIdx + 1) {
          score += 10; // Bonus for consecutive character matches
          matchSequenceCount++;
        }
        lastMatchIdx = i;
        queryIdx++;
        if (queryIdx === queryNorm.length) {
          break;
        }
      }
    }

    // If we matched the entire query sequence
    if (queryIdx === queryNorm.length) {
      // Calculate penalty for matches spread very far apart
      const span = lastMatchIdx - textNorm.indexOf(queryNorm[0]) + 1;
      const spreadPenalty = span > queryNorm.length ? (span - queryNorm.length) * 2 : 0;
      const finalScore = Math.max(10, score - spreadPenalty);
      return { score: finalScore };
    }

    return { score: 0 };
  }

  function performSearch(query) {
    if (!query) {
      searchResultsOverlay.classList.remove('active');
      searchResultsOverlay.innerHTML = '';
      return;
    }

    const queryNorm = query.toLowerCase().trim();
    const results = [];

    // Search inside Overview elements
    const overview = KambriumWikiData.overview;
    const extinctions = KambriumWikiData.massExtinctions;

    // Check Leitfossilien
    overview.leitfossilien.forEach(lf => {
      const matchName = fuzzyMatch(lf.name, queryNorm);
      const matchDesc = fuzzyMatch(lf.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: lf.name,
          desc: `Leitfossil: ${lf.description}`,
          tab: 'overview',
          targetId: `lf-${lf.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Check Events
    overview.keyEvents.forEach(e => {
      const matchName = fuzzyMatch(e.name, queryNorm);
      const matchDesc = fuzzyMatch(e.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: e.name,
          desc: `Hauptereignis: ${e.description}`,
          tab: 'overview',
          targetId: 'page-overview', // Scrolled generally, no separate ID for timelines
          score: score
        });
      }
    });

    // Check Extinctions
    extinctions.events.forEach(e => {
      const matchName = fuzzyMatch(e.name, queryNorm);
      const matchDesc = fuzzyMatch(e.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: e.name,
          desc: `Massenaussterben (${e.rate}): ${e.description}`,
          tab: 'overview',
          targetId: e.name.includes('Ordoviz') ? 'extinction-kambro-ordovizisch' : `extinction-${e.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Check Naming Info (Overview)
    const matchNamingTitle = fuzzyMatch(overview.namensherkunft.title, queryNorm);
    const matchNamingText = fuzzyMatch(overview.namensherkunft.text, queryNorm);
    const scoreNaming = Math.max(matchNamingTitle.score, matchNamingText.score);
    if (scoreNaming > 15) {
      results.push({
        name: overview.namensherkunft.title,
        desc: overview.namensherkunft.text,
        tab: 'overview',
        targetId: 'overview-naming',
        score: scoreNaming
      });
    }

    // Check Subdivisions (Overview)
    const matchSubTitle = fuzzyMatch(overview.subdivisions.title, queryNorm);
    const matchSubText = fuzzyMatch(overview.subdivisions.text, queryNorm);
    const scoreSub = Math.max(matchSubTitle.score, matchSubText.score);
    if (scoreSub > 15) {
      results.push({
        name: overview.subdivisions.title,
        desc: overview.subdivisions.text,
        tab: 'overview',
        targetId: 'overview-subdivisions',
        score: scoreSub
      });
    }

    // Check Climate (Overview)
    const matchKlimaTitle = fuzzyMatch(overview.klima.title, queryNorm);
    const matchKlimaText = fuzzyMatch(overview.klima.text, queryNorm);
    const scoreKlima = Math.max(matchKlimaTitle.score, matchKlimaText.score);
    if (scoreKlima > 15) {
      results.push({
        name: overview.klima.title,
        desc: overview.klima.text,
        tab: 'overview',
        targetId: 'overview-climate',
        score: scoreKlima
      });
    }

    // Check Sediments (Geography)
    const matchSedTitle = fuzzyMatch(KambriumWikiData.geography.sedimente.title, queryNorm);
    const matchSedText = fuzzyMatch(KambriumWikiData.geography.sedimente.text, queryNorm);
    const scoreSed = Math.max(matchSedTitle.score, matchSedText.score);
    if (scoreSed > 15) {
      results.push({
        name: KambriumWikiData.geography.sedimente.title,
        desc: KambriumWikiData.geography.sedimente.text,
        tab: 'geography',
        targetId: 'geography-sediments',
        score: scoreSed
      });
    }

    // Check Occurrences (Geography)
    const matchVorkTitle = fuzzyMatch(KambriumWikiData.geography.vorkommen.title, queryNorm);
    const matchVorkDe = fuzzyMatch(KambriumWikiData.geography.vorkommen.deutschland, queryNorm);
    const matchVorkGl = fuzzyMatch(KambriumWikiData.geography.vorkommen.global, queryNorm);
    const scoreVork = Math.max(matchVorkTitle.score, matchVorkDe.score, matchVorkGl.score);
    if (scoreVork > 15) {
      results.push({
        name: KambriumWikiData.geography.vorkommen.title,
        desc: KambriumWikiData.geography.vorkommen.deutschland,
        tab: 'geography',
        targetId: 'geography-occurrence',
        score: scoreVork
      });
    }

    // Search Flora
    KambriumWikiData.flora.species.forEach(s => {
      const matchName = fuzzyMatch(s.name, queryNorm);
      const matchSci = fuzzyMatch(s.scientific, queryNorm);
      const matchDesc = fuzzyMatch(s.description, queryNorm);
      const matchKeys = s.keywords.some(k => fuzzyMatch(k, queryNorm).score > 40) ? 60 : 0;
      const score = Math.max(matchName.score, matchSci.score, matchDesc.score, matchKeys);
      if (score > 15) {
        results.push({
          name: `${s.name} (${s.scientific})`,
          desc: `Flora: ${s.description}`,
          tab: 'flora',
          targetId: `flora-${s.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Search Fauna
    KambriumWikiData.fauna.species.forEach(s => {
      const matchName = fuzzyMatch(s.name, queryNorm);
      const matchSci = fuzzyMatch(s.scientific, queryNorm);
      const matchDesc = fuzzyMatch(s.description, queryNorm);
      const matchKeys = s.keywords.some(k => fuzzyMatch(k, queryNorm).score > 40) ? 60 : 0;
      const score = Math.max(matchName.score, matchSci.score, matchDesc.score, matchKeys);
      if (score > 15) {
        results.push({
          name: `${s.name} (${s.scientific})`,
          desc: `Fauna (${KambriumWikiData.fauna.categories[s.category]}): ${s.description}`,
          tab: 'fauna',
          targetId: `fauna-${s.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Search Geography
    KambriumWikiData.geography.continents.forEach(c => {
      const matchName = fuzzyMatch(c.name, queryNorm);
      const matchDesc = fuzzyMatch(c.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: c.name,
          desc: `Kontinent: ${c.description}`,
          tab: 'geography',
          targetId: `continent-${c.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    KambriumWikiData.geography.oceans.forEach(o => {
      const matchName = fuzzyMatch(o.name, queryNorm);
      const matchDesc = fuzzyMatch(o.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: o.name,
          desc: `Ozean: ${o.description}`,
          tab: 'geography',
          targetId: `ocean-${o.name.split(' ')[0].replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Search Biomes
    KambriumWikiData.biomes.list.forEach(b => {
      const matchName = fuzzyMatch(b.name, queryNorm);
      const matchDesc = fuzzyMatch(b.description, queryNorm);
      const score = Math.max(matchName.score, matchDesc.score);
      if (score > 15) {
        results.push({
          name: b.name,
          desc: `Biom (${b.conditions}): ${b.description}`,
          tab: 'geography',
          targetId: `biome-${b.name.replace(/\s+/g, '-').toLowerCase()}`,
          score: score
        });
      }
    });

    // Sort by Score descending
    results.sort((a, b) => b.score - a.score);

    // Render Search Results
    renderSearchResults(results, queryNorm);
  }

  function highlightMatches(text, query) {
    if (!query) return text;
    // Simple word boundaries/contains highlight
    const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
    return text.replace(regex, '<span class="search-highlight">$1</span>');
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function renderSearchResults(results, query) {
    if (results.length === 0) {
      searchResultsOverlay.innerHTML = '<div class="search-no-results">Keine Ergebnisse gefunden. Versuche ein anderes Wort.</div>';
      searchResultsOverlay.classList.add('active');
      return;
    }

    // Group results by tab
    const groups = {
      overview: { title: 'Übersicht & Krise', items: [] },
      flora: { title: 'Flora (Meeresalgen & Plankton)', items: [] },
      fauna: { title: 'Fauna (Tierwelt)', items: [] },
      geography: { title: 'Geographie & Biome', items: [] }
    };

    results.forEach(res => {
      groups[res.tab].items.push(res);
    });

    let html = '';
    Object.keys(groups).forEach(key => {
      const group = groups[key];
      if (group.items.length > 0) {
        html += `<div class="search-result-group">`;
        html += `<div class="search-result-group-title">${group.title}</div>`;
        group.items.forEach(item => {
          // Highlight match in title and snippet
          const highlightedName = highlightMatches(item.name, query);
          const highlightedDesc = highlightMatches(item.desc, query);
          
          html += `
            <div class="search-result-item" data-tab="${item.tab}" data-target-id="${item.targetId}">
              <div class="search-result-name">${highlightedName}</div>
              <div class="search-result-desc">${highlightedDesc}</div>
            </div>
          `;
        });
        html += `</div>`;
      }
    });

    searchResultsOverlay.innerHTML = html;
    searchResultsOverlay.classList.add('active');

    // Attach click events to items
    searchResultsOverlay.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const tab = item.getAttribute('data-tab');
        const targetId = item.getAttribute('data-target-id');
        
        switchTab(tab);
        searchResultsOverlay.classList.remove('active');
        searchInput.value = '';

        // Delayed scrolling to allow DOM transitions
        setTimeout(() => {
          const targetEl = document.getElementById(targetId);
          if (targetEl) {
            // Expand accordions if it's an accordion item
            if (targetEl.classList.contains('accordion-item')) {
              targetEl.classList.add('open');
              const content = targetEl.querySelector('.accordion-content');
              if (content) content.style.maxHeight = content.scrollHeight + 'px';
            }
            
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Pulse glow effect
            targetEl.style.transition = 'box-shadow 0.3s ease, border-color 0.3s ease';
            targetEl.style.boxShadow = 'var(--shadow-lg), var(--glow-accent-strong)';
            targetEl.style.borderColor = 'var(--color-accent)';
            
            setTimeout(() => {
              targetEl.style.boxShadow = '';
              targetEl.style.borderColor = '';
            }, 2500);
          }
        }, 150);
      });
    });
  }

  // --- Navigation & Sidebar Logic ---
  function switchTab(tabId) {
    activeTab = tabId;

    // Update buttons UI
    tabButtons.forEach(btn => {
      const parent = btn.parentElement;
      if (btn.getAttribute('data-tab') === tabId) {
        parent.classList.add('active');
      } else {
        parent.classList.remove('active');
      }
    });

    // Update visible pages
    pageContainers.forEach(container => {
      if (container.getAttribute('id') === `page-${tabId}`) {
        container.classList.add('active');
      } else {
        container.classList.remove('active');
      }
    });

    // Update Hero section text dynamically
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroBadge = document.querySelector('.hero-badge');

    if (tabId === 'overview') {
      heroBadge.textContent = 'Erdgeschichte / Paläozoikum';
      heroTitle.textContent = KambriumWikiData.overview.title;
      heroSubtitle.textContent = KambriumWikiData.overview.subtitle;
    } else if (tabId === 'flora') {
      heroBadge.textContent = 'Botanische Entwicklung';
      heroTitle.textContent = KambriumWikiData.flora.title;
      heroSubtitle.textContent = 'Die Anfänge pflanzlicher Photosynthese im Urozean';
    } else if (tabId === 'fauna') {
      heroBadge.textContent = 'Zoologische Explosion';
      heroTitle.textContent = KambriumWikiData.fauna.title;
      heroSubtitle.textContent = 'Der plötzliche Aufstieg der tierischen Skelette und Jäger';
    } else if (tabId === 'geography') {
      heroBadge.textContent = 'Geologie & Tektonik';
      heroTitle.textContent = KambriumWikiData.geography.title;
      heroSubtitle.textContent = 'Eine heissere Welt mit driftenden Kontinenten am Äquator';
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Close mobile menu
    sidebar.classList.remove('mobile-open');
  }

  function setupEventListeners() {
    // Tab switching
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Search events
    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // Hide search overlay when clicking outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResultsOverlay.contains(e.target)) {
        searchResultsOverlay.classList.remove('active');
      }
    });

    // Mobile Menu
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sidebar.classList.toggle('mobile-open');
    });

    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('mobile-open') && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
        sidebar.classList.remove('mobile-open');
      }
    });

    // --- Modal Event Listeners ---
    // Event delegation for dynamically rendered info buttons
    document.addEventListener('click', (e) => {
      const infoBtn = e.target.closest('.species-info-btn');
      if (infoBtn) {
        e.stopPropagation();
        const scientific = infoBtn.getAttribute('data-scientific');
        const name = infoBtn.getAttribute('data-name');
        openSpeciesModal(name, scientific);
      }
    });

    // Close button
    modalClose.addEventListener('click', closeSpeciesModal);

    // Close on click outside modal content
    speciesModal.addEventListener('click', (e) => {
      if (e.target === speciesModal) {
        closeSpeciesModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && speciesModal.classList.contains('active')) {
        closeSpeciesModal();
      }
    });
  }

  // --- Modal Helpers ---
  function openSpeciesModal(name, scientificName) {
    modalTitle.textContent = name;
    modalSubtitle.textContent = scientificName;
    
    // Google Images Link
    const googleQuery = encodeURIComponent(`${scientificName} cambrian`);
    modalGoogleLink.href = `https://www.google.com/search?tbm=isch&q=${googleQuery}`;

    // Set loading state
    modalWikiContent.innerHTML = `
      <div class="spinner"></div>
      <p style="text-align: center; color: var(--text-muted); font-size: 13px;">Suche Bilder und Informationen...</p>
    `;

    // Show modal with animation
    speciesModal.style.display = 'flex';
    speciesModal.offsetHeight; // trigger reflow
    speciesModal.classList.add('active');

    // Clean name for Wikipedia URL
    const wikiTerm = scientificName.replace(/\s+/g, '_');

    // Fetch German Wikipedia page summary
    fetch(`https://de.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTerm)}`)
      .then(res => {
        if (!res.ok) {
          // Fallback to English Wikipedia
          return fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(wikiTerm)}`);
        }
        return res;
      })
      .then(res => {
        if (!res.ok) throw new Error('Wikipedia article not found');
        return res.json();
      })
      .then(data => {
        let contentHtml = '';
        if (data.originalimage && data.originalimage.source) {
          contentHtml += `<img src="${data.originalimage.source}" alt="${data.title}" class="modal-wiki-img">`;
        }
        
        const descriptionText = data.extract || 'Keine detaillierte Beschreibung auf Wikipedia gefunden.';
        contentHtml += `<div class="modal-wiki-text">${descriptionText}</div>`;
        modalWikiContent.innerHTML = contentHtml;
      })
      .catch(err => {
        // Fallback display if not found in German or English
        modalWikiContent.innerHTML = `
          <div style="text-align: center; color: var(--text-muted); padding: 24px 0;">
            <p>Keine Wikipedia-Details für <strong>${scientificName}</strong> gefunden.</p>
            <p style="font-size: 13px; margin-top: 8px;">Nutze den Button unten für eine vollständige Google-Bildersuche.</p>
          </div>
        `;
      });
  }

  function closeSpeciesModal() {
    speciesModal.classList.remove('active');
    setTimeout(() => {
      speciesModal.style.display = 'none';
    }, 300);
  }
});
