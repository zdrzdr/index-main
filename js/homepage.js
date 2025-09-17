(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var settingsContainer = doc.getElementById('settings-container');
  var settingsToggle = doc.getElementById('settings-toggle');
  var settingsMenu = doc.getElementById('settings-menu');
  var themeToggle = doc.getElementById('setting-theme');
  var widthInput = doc.getElementById('setting-icon-width');
  var heightInput = doc.getElementById('setting-icon-height');
  var widthValue = doc.getElementById('icon-width-value');
  var heightValue = doc.getElementById('icon-height-value');

  if (!settingsContainer) {
    return;
  }

  var SETTINGS_KEY = 'homepage-settings';
  var SEARCH_KEY = 'searchData';
  var defaultSettings = {
    theme: null,
    iconWidth: 64,
    iconHeight: 64
  };

  function clamp(value, min, max) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
      return min;
    }
    return Math.min(Math.max(number, min), max);
  }

  function loadSettings() {
    var storedSettings = Object.assign({}, defaultSettings);
    try {
      var saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (parsed.theme === 'dark' || parsed.theme === 'light') {
            storedSettings.theme = parsed.theme;
          }
          if (Number.isFinite(parsed.iconWidth)) {
            storedSettings.iconWidth = parsed.iconWidth;
          }
          if (Number.isFinite(parsed.iconHeight)) {
            storedSettings.iconHeight = parsed.iconHeight;
          }
        }
      }
    } catch (error) {
      // 忽略读取失败
    }
    if (storedSettings.theme === null) {
      try {
        var legacyTheme = localStorage.getItem('theme');
        if (legacyTheme === 'dark' || legacyTheme === 'light') {
          storedSettings.theme = legacyTheme;
        }
      } catch (error) {
        // 忽略旧字段读取失败
      }
    }
    return storedSettings;
  }

  var settings = loadSettings();

  function persistSettings() {
    try {
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          theme: settings.theme,
          iconWidth: settings.iconWidth,
          iconHeight: settings.iconHeight
        })
      );
      localStorage.removeItem('theme');
    } catch (error) {
      // 忽略写入失败
    }
  }

  var prefersDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function resolveTheme() {
    if (settings.theme === 'dark' || settings.theme === 'light') {
      return settings.theme;
    }
    return prefersDark && prefersDark.matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    var isDark = theme === 'dark';
    document.body.classList.toggle('dark-mode', isDark);
    if (themeToggle) {
      themeToggle.checked = isDark;
    }
  }

  applyTheme(resolveTheme());

  if (themeToggle) {
    themeToggle.addEventListener('change', function () {
      settings.theme = themeToggle.checked ? 'dark' : 'light';
      applyTheme(settings.theme);
      persistSettings();
    });
  }

  if (prefersDark) {
    var handlePreferenceChange = function (event) {
      if (settings.theme !== 'dark' && settings.theme !== 'light') {
        applyTheme(event.matches ? 'dark' : 'light');
      }
    };

    if (typeof prefersDark.addEventListener === 'function') {
      prefersDark.addEventListener('change', handlePreferenceChange);
    } else if (typeof prefersDark.addListener === 'function') {
      prefersDark.addListener(handlePreferenceChange);
    }
  }

  var widthMin = widthInput ? Number(widthInput.min) || 48 : 48;
  var widthMax = widthInput ? Number(widthInput.max) || 120 : 120;
  var heightMin = heightInput ? Number(heightInput.min) || 48 : 48;
  var heightMax = heightInput ? Number(heightInput.max) || 120 : 120;

  function updateIconDimension(key, value, min, max, shouldPersist) {
    var clamped = clamp(value, min, max);
    settings[key] = clamped;
    var cssVariable = key === 'iconWidth' ? '--nav-img-width' : '--nav-img-height';
    root.style.setProperty(cssVariable, clamped + 'px');
    if (key === 'iconWidth' && widthValue) {
      widthValue.textContent = clamped + 'px';
    }
    if (key === 'iconHeight' && heightValue) {
      heightValue.textContent = clamped + 'px';
    }
    if (shouldPersist) {
      persistSettings();
    }
  }

  updateIconDimension('iconWidth', settings.iconWidth, widthMin, widthMax, false);
  updateIconDimension('iconHeight', settings.iconHeight, heightMin, heightMax, false);

  if (widthInput) {
    widthInput.value = clamp(settings.iconWidth, widthMin, widthMax);
    widthInput.addEventListener('input', function () {
      updateIconDimension('iconWidth', widthInput.value, widthMin, widthMax, false);
    });
    widthInput.addEventListener('change', function () {
      updateIconDimension('iconWidth', widthInput.value, widthMin, widthMax, true);
    });
  }

  if (heightInput) {
    heightInput.value = clamp(settings.iconHeight, heightMin, heightMax);
    heightInput.addEventListener('input', function () {
      updateIconDimension('iconHeight', heightInput.value, heightMin, heightMax, false);
    });
    heightInput.addEventListener('change', function () {
      updateIconDimension('iconHeight', heightInput.value, heightMin, heightMax, true);
    });
  }

  function openSettingsMenu() {
    if (!settingsMenu) {
      return;
    }
    closeSearchMenu();
    settingsMenu.removeAttribute('hidden');
    requestAnimationFrame(function () {
      settingsMenu.classList.add('is-visible');
      settingsContainer.classList.add('is-open');
    });
    if (settingsToggle) {
      settingsToggle.setAttribute('aria-expanded', 'true');
    }
  }

  function closeSettingsMenu() {
    if (!settingsMenu || settingsMenu.hasAttribute('hidden')) {
      if (settingsToggle) {
        settingsToggle.setAttribute('aria-expanded', 'false');
      }
      settingsContainer.classList.remove('is-open');
      return;
    }
    settingsMenu.classList.remove('is-visible');
    settingsContainer.classList.remove('is-open');
    if (settingsToggle) {
      settingsToggle.setAttribute('aria-expanded', 'false');
    }

    var hideMenu = function () {
      if (!settingsMenu.classList.contains('is-visible')) {
        settingsMenu.setAttribute('hidden', '');
      }
    };

    settingsMenu.addEventListener('transitionend', function handleTransition(event) {
      if (event.target === settingsMenu) {
        hideMenu();
        settingsMenu.removeEventListener('transitionend', handleTransition);
      }
    });

    window.setTimeout(hideMenu, 260);
  }

  if (settingsToggle && settingsMenu) {
    settingsToggle.addEventListener('click', function () {
      if (settingsMenu.hasAttribute('hidden')) {
        openSettingsMenu();
      } else {
        closeSettingsMenu();
      }
    });
  }

  var activePointerDownTarget = null;
  doc.addEventListener('pointerdown', function (event) {
    activePointerDownTarget = event.target;
  });

  doc.addEventListener('pointerup', function (event) {
    var target = activePointerDownTarget || event.target;
    activePointerDownTarget = null;
    if (settingsMenu && !settingsMenu.hasAttribute('hidden')) {
      if (
        settingsContainer.contains(target) === false
      ) {
        closeSettingsMenu();
      }
    }
    if (searchMenu && !searchMenu.hasAttribute('hidden')) {
      if (
        searchMenu.contains(target) === false &&
        (!searchToggle || searchToggle.contains(target) === false)
      ) {
        closeSearchMenu();
      }
    }
  });

  doc.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeSettingsMenu();
      closeSearchMenu();
    }
  });

  var defaultSearchData = {
    thisSearch: 'https://www.baidu.com/s?wd=',
    thisSearchIcon: 'images/sou1.png',
    data: [
      { name: '百度', url: 'https://www.baidu.com/s?wd=', img: 'images/sou1.png' },
      { name: 'Google', url: 'https://www.google.com/search?q=', img: 'images/sou2.png' },
      { name: 'Bing搜索', url: 'https://cn.bing.com/search?q=', img: 'images/sou3.png' },
      { name: '360搜索', url: 'https://www.so.com/s?q=', img: 'images/sou4.png' },
      { name: '搜狗搜索', url: 'https://www.sogou.com/web?query=', img: 'images/sou5.png' },
      { name: '多吉搜索', url: 'https://www.dogedoge.com/results?q=', img: 'images/sou6.png' }
    ]
  };

  function cloneSearchData(data) {
    return {
      thisSearch: data.thisSearch,
      thisSearchIcon: data.thisSearchIcon,
      data: data.data.slice()
    };
  }

  function loadSearchData() {
    var data = cloneSearchData(defaultSearchData);
    try {
      var saved = localStorage.getItem(SEARCH_KEY);
      if (saved) {
        var parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          if (typeof parsed.thisSearch === 'string') {
            data.thisSearch = parsed.thisSearch;
          }
          if (typeof parsed.thisSearchIcon === 'string') {
            data.thisSearchIcon = parsed.thisSearchIcon;
          }
          if (Array.isArray(parsed.data) && parsed.data.length) {
            data.data = parsed.data
              .filter(function (item) {
                return item && typeof item.url === 'string' && typeof item.img === 'string' && typeof item.name === 'string';
              })
              .map(function (item) {
                return { name: item.name, url: item.url, img: item.img };
              });
            if (!data.data.length) {
              data.data = cloneSearchData(defaultSearchData).data;
            }
          }
        }
      }
    } catch (error) {
      // 忽略读取失败
    }
    return data;
  }

  var searchData = loadSearchData();
  var searchToggle = doc.getElementById('search-engine-toggle');
  var searchMenu = doc.getElementById('search-engine-menu');
  var searchList = searchMenu ? searchMenu.querySelector('.search-engine-list') : null;
  var searchIcon = doc.getElementById('search-engine-icon');
  var searchInput = doc.getElementById('txt');
  var searchButton = doc.getElementById('search-btn');

  function persistSearchData() {
    try {
      localStorage.setItem(SEARCH_KEY, JSON.stringify(searchData));
    } catch (error) {
      // 忽略写入失败
    }
  }

  function getOptions() {
    return searchList ? Array.from(searchList.querySelectorAll('li')) : [];
  }

  function findActiveOptionIndex() {
    var index = searchData.data.findIndex(function (item) {
      return item.url === searchData.thisSearch;
    });
    return index >= 0 ? index : 0;
  }

  function updateActiveOption() {
    var activeIndex = findActiveOptionIndex();
    var options = getOptions();
    for (var i = 0; i < options.length; i += 1) {
      var option = options[i];
      if (i === activeIndex) {
        option.classList.add('is-active');
        option.setAttribute('aria-selected', 'true');
      } else {
        option.classList.remove('is-active');
        option.removeAttribute('aria-selected');
      }
    }

    if (searchIcon) {
      var current = searchData.data[activeIndex] || searchData.data[0];
      searchIcon.src = searchData.thisSearchIcon || current.img;
      searchIcon.alt = current ? current.name + ' 图标' : '搜索引擎图标';
    }
    if (searchToggle) {
      var labelName = (searchData.data[activeIndex] && searchData.data[activeIndex].name) || '搜索引擎';
      searchToggle.setAttribute('aria-label', '当前搜索引擎：' + labelName + '，点击切换');
    }
  }

  function renderSearchOptions() {
    if (!searchList) {
      return;
    }
    searchList.innerHTML = '';
    searchData.data.forEach(function (item, index) {
      var li = doc.createElement('li');
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', '-1');
      li.dataset.index = String(index);

      var icon = doc.createElement('img');
      icon.src = item.img;
      icon.alt = '';
      li.appendChild(icon);

      var name = doc.createElement('span');
      name.textContent = item.name;
      li.appendChild(name);

      searchList.appendChild(li);
    });
    updateActiveOption();
  }

  function selectSearchOption(index) {
    var option = searchData.data[index];
    if (!option) {
      return;
    }
    searchData.thisSearch = option.url;
    searchData.thisSearchIcon = option.img;
    updateActiveOption();
    persistSearchData();
  }

  function focusOption(index) {
    var options = getOptions();
    if (!options.length) {
      return;
    }
    var clampedIndex = Math.min(Math.max(index, 0), options.length - 1);
    options[clampedIndex].focus();
  }

  function openSearchMenu() {
    if (!searchMenu) {
      return;
    }
    closeSettingsMenu();
    searchMenu.removeAttribute('hidden');
    requestAnimationFrame(function () {
      searchMenu.classList.add('is-open');
    });
    if (searchToggle) {
      searchToggle.setAttribute('aria-expanded', 'true');
    }
    focusOption(findActiveOptionIndex());
  }

  function closeSearchMenu() {
    if (!searchMenu || searchMenu.hasAttribute('hidden')) {
      if (searchToggle) {
        searchToggle.setAttribute('aria-expanded', 'false');
      }
      return;
    }
    searchMenu.classList.remove('is-open');
    if (searchToggle) {
      searchToggle.setAttribute('aria-expanded', 'false');
    }
    searchMenu.addEventListener('transitionend', function handleTransition(event) {
      if (event.target === searchMenu) {
        searchMenu.setAttribute('hidden', '');
        searchMenu.removeEventListener('transitionend', handleTransition);
      }
    });
    window.setTimeout(function () {
      if (!searchMenu.classList.contains('is-open')) {
        searchMenu.setAttribute('hidden', '');
      }
    }, 240);
  }

  renderSearchOptions();

  if (searchToggle && searchMenu) {
    searchToggle.addEventListener('click', function () {
      if (searchMenu.hasAttribute('hidden')) {
        openSearchMenu();
      } else {
        closeSearchMenu();
      }
    });

    searchToggle.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        openSearchMenu();
      }
    });
  }

  if (searchList) {
    searchList.addEventListener('click', function (event) {
      var target = event.target.closest('li');
      if (!target) {
        return;
      }
      var index = Number(target.dataset.index);
      if (Number.isNaN(index)) {
        return;
      }
      selectSearchOption(index);
      closeSearchMenu();
      if (searchToggle) {
        searchToggle.focus();
      }
    });

    searchList.addEventListener('keydown', function (event) {
      var options = getOptions();
      if (!options.length) {
        return;
      }
      var focusedIndex = options.indexOf(doc.activeElement);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        focusOption(focusedIndex + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        focusOption(focusedIndex - 1);
      } else if (event.key === 'Enter') {
        event.preventDefault();
        var activeIndex = focusedIndex >= 0 ? focusedIndex : findActiveOptionIndex();
        selectSearchOption(activeIndex);
        closeSearchMenu();
        if (searchToggle) {
          searchToggle.focus();
        }
      }
    });
  }

  if (searchMenu) {
    searchMenu.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeSearchMenu();
        if (searchToggle) {
          searchToggle.focus();
        }
      }
    });
  }

  function performSearch() {
    if (!searchInput) {
      return;
    }
    var keyword = searchInput.value.trim();
    if (!keyword) {
      return;
    }
    var targetUrl = searchData.thisSearch || defaultSearchData.thisSearch;
    var finalUrl = targetUrl + encodeURIComponent(keyword);
    window.open(finalUrl, '_blank');
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        performSearch();
      } else if (event.key === 'ArrowDown' && searchMenu) {
        openSearchMenu();
      }
    });
  }

  if (searchButton) {
    searchButton.addEventListener('click', function () {
      performSearch();
    });
  }
})();
