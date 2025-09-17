(function () {
  'use strict';

  var searchToggle = document.getElementById('search-engine-toggle');
  var searchMenu = document.getElementById('search-engine');
  var searchList = document.getElementById('search-engine-list');
  var searchInput = document.getElementById('txt');
  var searchButton = document.getElementById('search-btn');

  if (!searchToggle || !searchMenu || !searchList || !searchInput || !searchButton) {
    return;
  }

  var searchBox = searchToggle.closest('.search-box');
  var searchIcon = searchToggle.querySelector('.search-icon');

  var STORAGE_KEY = 'searchData';
  var ENGINES = [
    { name: '百度', url: 'https://www.baidu.com/s?wd=', icon: 'images/sou1.png' },
    { name: 'Google', url: 'https://www.google.com/search?q=', icon: 'images/sou2.png' },
    { name: 'Bing搜索', url: 'https://cn.bing.com/search?q=', icon: 'images/sou3.png' },
    { name: '360搜索', url: 'https://www.so.com/s?q=', icon: 'images/sou4.png' },
    { name: '搜狗搜索', url: 'https://www.sogou.com/web?query=', icon: 'images/sou5.png' },
    { name: '多吉搜索', url: 'https://www.dogedoge.com/results?q=', icon: 'images/sou6.png' }
  ];

  var state = {
    open: false,
    engineIndex: 0
  };

  function loadSavedEngineIndex() {
    if (!window.localStorage) {
      return 0;
    }
    try {
      var stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return 0;
      }
      var parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        if (typeof parsed.engineIndex === 'number' && ENGINES[parsed.engineIndex]) {
          return parsed.engineIndex;
        }
        if (parsed.thisSearch) {
          for (var i = 0; i < ENGINES.length; i += 1) {
            if (ENGINES[i].url === parsed.thisSearch) {
              return i;
            }
          }
        }
      }
    } catch (error) {
      // Ignore malformed storage values.
    }
    return 0;
  }

  function persistEngineIndex() {
    try {
      if (!window.localStorage) {
        return;
      }
      var engine = ENGINES[state.engineIndex];
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          engineIndex: state.engineIndex,
          thisSearch: engine.url,
          thisSearchIcon: engine.icon
        })
      );
    } catch (error) {
      // Ignore persistence errors.
    }
  }

  function renderMenu() {
    searchList.innerHTML = '';
    ENGINES.forEach(function (engine, index) {
      var listItem = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'search-engine-option';
      button.setAttribute('role', 'option');
      button.setAttribute('data-engine-index', String(index));
      button.id = 'search-engine-option-' + index;

      var icon = document.createElement('img');
      icon.src = engine.icon;
      icon.alt = '';

      var label = document.createElement('span');
      label.textContent = engine.name;

      button.appendChild(icon);
      button.appendChild(label);
      listItem.appendChild(button);
      searchList.appendChild(listItem);
    });
  }

  function updateMenuSelection() {
    var selectedId = '';
    var buttons = searchList.querySelectorAll('button[data-engine-index]');
    buttons.forEach(function (button) {
      var index = Number(button.getAttribute('data-engine-index'));
      var isSelected = index === state.engineIndex;
      button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
      if (isSelected) {
        selectedId = button.id;
      }
    });
    if (selectedId) {
      searchMenu.setAttribute('aria-activedescendant', selectedId);
    } else {
      searchMenu.removeAttribute('aria-activedescendant');
    }
  }

  function applyEngine(index) {
    if (!ENGINES[index]) {
      index = 0;
    }
    state.engineIndex = index;
    var engine = ENGINES[state.engineIndex];
    if (searchIcon) {
      searchIcon.src = engine.icon;
      searchIcon.alt = engine.name + ' 图标';
    }
    searchToggle.setAttribute('aria-label', '当前搜索引擎：' + engine.name);
    searchInput.setAttribute('placeholder', '使用 ' + engine.name + ' 搜索');
    updateMenuSelection();
  }

  function focusOption(index) {
    var button = searchList.querySelector('button[data-engine-index="' + index + '"]');
    if (button) {
      button.focus({ preventScroll: true });
      searchMenu.setAttribute('aria-activedescendant', button.id);
    }
  }

  function openMenu() {
    if (state.open) {
      return;
    }
    state.open = true;
    searchMenu.classList.add('is-open');
    searchMenu.setAttribute('aria-hidden', 'false');
    searchToggle.setAttribute('aria-expanded', 'true');
    updateMenuSelection();
    focusOption(state.engineIndex);
  }

  function closeMenu() {
    if (!state.open) {
      return;
    }
    state.open = false;
    searchMenu.classList.remove('is-open');
    searchMenu.setAttribute('aria-hidden', 'true');
    searchToggle.setAttribute('aria-expanded', 'false');
    searchMenu.removeAttribute('aria-activedescendant');
  }

  function toggleMenu() {
    if (state.open) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function selectEngine(index) {
    applyEngine(index);
    persistEngineIndex();
    closeMenu();
    searchInput.focus();
  }

  function performSearch() {
    var query = searchInput.value.trim();
    if (!query) {
      searchInput.focus();
      return;
    }
    var engine = ENGINES[state.engineIndex];
    var url = engine.url + encodeURIComponent(query);
    window.open(url, '_blank');
  }

  searchMenu.setAttribute('aria-hidden', 'true');
  searchToggle.setAttribute('aria-expanded', 'false');

  renderMenu();
  state.engineIndex = loadSavedEngineIndex();
  applyEngine(state.engineIndex);

  searchToggle.addEventListener('click', function () {
    toggleMenu();
  });

  searchToggle.addEventListener('keydown', function (event) {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!state.open) {
        openMenu();
      }
      focusOption(state.engineIndex);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleMenu();
    } else if (event.key === 'Escape') {
      if (state.open) {
        event.preventDefault();
        closeMenu();
      }
    }
  });

  searchInput.addEventListener('focus', function () {
    closeMenu();
  });

  searchButton.addEventListener('click', function () {
    performSearch();
  });

  searchInput.addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      performSearch();
    }
  });

  searchList.addEventListener('click', function (event) {
    var target = event.target;
    if (!target) {
      return;
    }
    var button = target.closest('button[data-engine-index]');
    if (!button) {
      return;
    }
    var index = Number(button.getAttribute('data-engine-index'));
    if (!Number.isNaN(index)) {
      selectEngine(index);
    }
  });

  searchList.addEventListener('keydown', function (event) {
    var target = event.target;
    if (!target || !target.hasAttribute('data-engine-index')) {
      return;
    }
    var current = Number(target.getAttribute('data-engine-index'));
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      var delta = event.key === 'ArrowDown' ? 1 : -1;
      var next = (current + delta + ENGINES.length) % ENGINES.length;
      focusOption(next);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectEngine(current);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
      searchToggle.focus();
    }
  });

  document.addEventListener('click', function (event) {
    if (!state.open) {
      return;
    }
    if (searchBox && !searchBox.contains(event.target)) {
      closeMenu();
    }
  });
})();
