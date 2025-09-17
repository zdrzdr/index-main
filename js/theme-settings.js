(function () {
  'use strict';

  var docEl = document.documentElement;
  var body = document.body;
  if (!body || !docEl) {
    return;
  }

  var SETTINGS_KEY = 'opsCoffee:settings';
  var DEFAULTS = {
    theme: 'system',
    iconWidth: 48,
    iconHeight: 48
  };
  var MIN_ICON_SIZE = 32;
  var MAX_ICON_SIZE = 96;

  function clampDimension(value) {
    var number = Number(value);
    if (!Number.isFinite(number)) {
      return DEFAULTS.iconWidth;
    }
    return Math.min(MAX_ICON_SIZE, Math.max(MIN_ICON_SIZE, Math.round(number)));
  }

  function loadSettings() {
    var settings = {
      theme: DEFAULTS.theme,
      iconWidth: DEFAULTS.iconWidth,
      iconHeight: DEFAULTS.iconHeight
    };

    try {
      var stored = window.localStorage ? localStorage.getItem(SETTINGS_KEY) : null;
      if (stored) {
        var parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          if (parsed.theme === 'light' || parsed.theme === 'dark' || parsed.theme === 'system') {
            settings.theme = parsed.theme;
          }
          if (typeof parsed.iconWidth === 'number') {
            settings.iconWidth = clampDimension(parsed.iconWidth);
          }
          if (typeof parsed.iconHeight === 'number') {
            settings.iconHeight = clampDimension(parsed.iconHeight);
          }
        }
      } else {
        var legacyTheme = window.localStorage ? localStorage.getItem('theme') : null;
        if (legacyTheme === 'light' || legacyTheme === 'dark') {
          settings.theme = legacyTheme;
        }
      }
    } catch (error) {
      // Ignore storage access issues and fall back to defaults.
    }

    settings.iconWidth = clampDimension(settings.iconWidth);
    settings.iconHeight = clampDimension(settings.iconHeight);

    return settings;
  }

  var settings = loadSettings();

  var settingsRoot = document.getElementById('page-settings');
  var settingsToggle = document.getElementById('settings-toggle');
  var settingsPanel = document.getElementById('settings-panel');
  var settingsClose = document.getElementById('settings-close');
  var themeButtons = Array.prototype.slice.call(document.querySelectorAll('.theme-mode-button'));
  var widthInput = document.getElementById('icon-width-control');
  var heightInput = document.getElementById('icon-height-control');
  var widthOutput = document.getElementById('icon-width-value');
  var heightOutput = document.getElementById('icon-height-value');
  var themeState = document.getElementById('theme-state');
  var themeIndicator = document.getElementById('settings-toggle-theme');
  var navImages = Array.prototype.slice.call(document.querySelectorAll('.nav-img'));

  var mediaQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  function persistSettings() {
    try {
      if (!window.localStorage) {
        return;
      }
      var payload = {
        theme: settings.theme,
        iconWidth: settings.iconWidth,
        iconHeight: settings.iconHeight
      };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
      if (localStorage.getItem('theme')) {
        localStorage.removeItem('theme');
      }
    } catch (error) {
      // Ignore persistence errors (for example, private mode restrictions).
    }
  }

  function resolveTheme(preference) {
    if (preference === 'dark' || preference === 'light') {
      return preference;
    }
    if (mediaQuery && typeof mediaQuery.matches === 'boolean') {
      return mediaQuery.matches ? 'dark' : 'light';
    }
    return 'light';
  }

  function updateThemeIndicator(theme) {
    if (!themeIndicator) {
      return;
    }
    themeIndicator.textContent = theme === 'dark' ? '🌙' : '☀️';
  }

  function applyTheme(resolvedTheme) {
    var isDark = resolvedTheme === 'dark';
    body.classList.toggle('dark-mode', isDark);
    docEl.style.setProperty('color-scheme', isDark ? 'dark' : 'light');
    updateThemeIndicator(resolvedTheme);
  }

  function applyIconDimensions(width, height) {
    var widthValue = width + 'px';
    var heightValue = height + 'px';
    docEl.style.setProperty('--icon-wrapper-width', widthValue);
    docEl.style.setProperty('--icon-wrapper-height', heightValue);
    navImages.forEach(function (icon) {
      icon.style.width = widthValue;
      icon.style.height = heightValue;
    });
  }

  function syncThemeButtons() {
    var preference = settings.theme;
    themeButtons.forEach(function (button) {
      var value = button.getAttribute('data-theme-value');
      var isActive = value === preference || (value === 'system' && preference !== 'light' && preference !== 'dark');
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      button.classList.toggle('is-active', isActive);
    });
  }

  function syncDimensionControls() {
    if (widthInput) {
      widthInput.value = String(settings.iconWidth);
    }
    if (widthOutput) {
      widthOutput.textContent = settings.iconWidth + ' px';
    }
    if (heightInput) {
      heightInput.value = String(settings.iconHeight);
    }
    if (heightOutput) {
      heightOutput.textContent = settings.iconHeight + ' px';
    }
  }

  function updateThemeStateLabel() {
    if (!themeState) {
      return;
    }
    if (settings.theme === 'dark') {
      themeState.textContent = '当前：深色模式';
    } else if (settings.theme === 'light') {
      themeState.textContent = '当前：浅色模式';
    } else {
      var resolved = resolveTheme('system');
      themeState.textContent = '当前：跟随系统（' + (resolved === 'dark' ? '深色' : '浅色') + '）';
    }
  }

  applyIconDimensions(settings.iconWidth, settings.iconHeight);
  applyTheme(resolveTheme(settings.theme));
  syncThemeButtons();
  syncDimensionControls();
  updateThemeStateLabel();

  if (mediaQuery) {
    var handleSystemChange = function () {
      if (settings.theme === 'system') {
        applyTheme(resolveTheme('system'));
        updateThemeStateLabel();
      }
    };
    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleSystemChange);
    } else if (typeof mediaQuery.addListener === 'function') {
      mediaQuery.addListener(handleSystemChange);
    }
  }

  function isPanelOpen() {
    return !!(settingsPanel && settingsPanel.classList.contains('is-open'));
  }

  function openPanel() {
    if (!settingsPanel || !settingsToggle) {
      return;
    }
    settingsPanel.classList.add('is-open');
    settingsPanel.setAttribute('aria-hidden', 'false');
    settingsToggle.setAttribute('aria-expanded', 'true');
  }

  function closePanel() {
    if (!settingsPanel || !settingsToggle) {
      return;
    }
    settingsPanel.classList.remove('is-open');
    settingsPanel.setAttribute('aria-hidden', 'true');
    settingsToggle.setAttribute('aria-expanded', 'false');
  }

  if (settingsToggle) {
    settingsToggle.addEventListener('click', function () {
      if (isPanelOpen()) {
        closePanel();
      } else {
        openPanel();
      }
    });
  }

  if (settingsClose) {
    settingsClose.addEventListener('click', function () {
      closePanel();
      if (settingsToggle) {
        settingsToggle.focus();
      }
    });
  }

  document.addEventListener('click', function (event) {
    if (!settingsPanel || !settingsToggle || !settingsRoot) {
      return;
    }
    if (!settingsRoot.contains(event.target)) {
      closePanel();
    }
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isPanelOpen()) {
      closePanel();
      if (settingsToggle) {
        settingsToggle.focus();
      }
    }
  });

  themeButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      var value = button.getAttribute('data-theme-value');
      if (value !== 'light' && value !== 'dark' && value !== 'system') {
        return;
      }
      settings.theme = value;
      persistSettings();
      applyTheme(resolveTheme(settings.theme));
      syncThemeButtons();
      updateThemeStateLabel();
    });
  });

  function handleDimensionInput(event) {
    var target = event.target;
    if (!target) {
      return;
    }
    var raw = target.value;
    var next = clampDimension(raw);
    if (target === widthInput) {
      settings.iconWidth = next;
    } else if (target === heightInput) {
      settings.iconHeight = next;
    } else {
      return;
    }
    applyIconDimensions(settings.iconWidth, settings.iconHeight);
    syncDimensionControls();
    persistSettings();
  }

  if (widthInput) {
    widthInput.addEventListener('input', handleDimensionInput);
    widthInput.addEventListener('change', handleDimensionInput);
  }

  if (heightInput) {
    heightInput.addEventListener('input', handleDimensionInput);
    heightInput.addEventListener('change', handleDimensionInput);
  }
})();
