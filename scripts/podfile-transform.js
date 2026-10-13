'use strict';

/**
 * Text transformations that migrate a customer Podfile to the SPM-only ZelloSDK setup.
 * Shared by the `setup-ios` CLI and the Expo config plugin. Pure: string in, result out.
 * Every step is idempotent and aborts (reports `manual`) instead of guessing.
 */

const MIN_IOS = '17.0';

const REQUIRE_LINES = [
  "require Pod::Executable.execute_command('node', ['-p',",
  '  "require.resolve(\'@zelloptt/react-native-zello-sdk/scripts/zello_pods.rb\', {paths: [process.argv[1]]})",',
  '  __dir__]).strip',
];

const RESILIENT_POD_NAMES = [
  'PhoneNumberKit',
  'SnowplowTracker',
  'CocoaLumberjack',
  'PromisesSwift',
];

// Only top-level Podfile targets with such names are auto-detected as app extensions.
const EXTENSION_NAME_RE = /Extension|NSE|Widget/i;
const COMMENT_RE = /^\s*#/;
const BLANK_RE = /^\s*$/;

function stripComment(line) {
  // Good enough for Podfile structure scanning: drop trailing `# ...` outside of simple quotes.
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote && line[i - 1] !== '\\') {
        quote = null;
      }
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (ch === '#') {
      return line.slice(0, i);
    }
  }
  return line;
}

/** Removes lines [start, end] and one adjacent blank line if that would leave two in a row. */
function removeRange(lines, start, end) {
  lines.splice(start, end - start + 1);
  if (
    start > 0 &&
    start < lines.length &&
    BLANK_RE.test(lines[start - 1]) &&
    BLANK_RE.test(lines[start])
  ) {
    lines.splice(start, 1);
  }
}

function compareVersions(a, b) {
  const pa = String(a).split('.').map(Number);
  const pb = String(b).split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) {
      return d;
    }
  }
  return 0;
}

// 3a -------------------------------------------------------------------------

function removeZelloPods(lines, result) {
  const podRe = /^\s*pod\s*\(?\s*['"]ZelloSDK['"]/;
  let removed = false;
  for (let i = 0; i < lines.length; i++) {
    if (!podRe.test(lines[i])) {
      continue;
    }
    const code = stripComment(lines[i]).trimEnd();
    if (/[,\\]$/.test(code) || /\(/.test(code.split(/['"]ZelloSDK/)[0])) {
      result.manual.push(
        `Line ${i + 1}: multi-line or parenthesised \`pod 'ZelloSDK'\` declaration. Delete it by hand.`
      );
      continue;
    }
    let start = i;
    while (
      start > 0 &&
      COMMENT_RE.test(lines[start - 1]) &&
      /zellosdk|podspec/i.test(lines[start - 1])
    ) {
      start--;
    }
    removeRange(lines, start, i);
    i = start - 1;
    removed = true;
  }
  if (removed) {
    result.notes.push("Removed `pod 'ZelloSDK'` (now resolved via SwiftPM).");
  }
}

// 3b -------------------------------------------------------------------------

function removeResilientReadmeForm(lines) {
  const steps = [
    /^installer\.pods_project\.targets\.each do \|\w+\|$/,
    /^if %w\[[^\]]*\]\.include\?\(\w+\.name\)$/,
    /^\w+\.build_configurations\.each do \|\w+\|$/,
    /^\w+\.build_settings\[['"]BUILD_LIBRARY_FOR_DISTRIBUTION['"]\] = ['"]YES['"]$/,
    /^end$/,
    /^end$/,
    /^end$/,
  ];
  let removed = false;
  for (let i = 0; i + steps.length <= lines.length; i++) {
    if (
      steps.every((re, k) => re.test(stripComment(lines[i + k]).trim())) &&
      RESILIENT_POD_NAMES.some((n) => lines[i + 1].includes(n))
    ) {
      removeRange(lines, i, i + steps.length - 1);
      removed = true;
      i--;
    }
  }
  return removed;
}

function removeResilientExampleForm(lines) {
  let removed = false;
  for (let i = 0; i < lines.length; i++) {
    const m = /^\s*(\w+)\s*=\s*\[([^\]]*)\]\s*$/.exec(stripComment(lines[i]));
    if (!m || !RESILIENT_POD_NAMES.some((n) => m[2].includes(n))) {
      continue;
    }
    const variable = m[1];
    let start = i;
    while (start > 0 && COMMENT_RE.test(lines[start - 1])) {
      start--;
    }
    const comment = lines.slice(start, i).join('\n');
    if (
      !/resilient|BUILD_LIBRARY_FOR_DISTRIBUTION|library evolution/i.test(
        comment
      )
    ) {
      start = i;
    }
    removeRange(lines, start, i);
    removed = true;

    const branch = [
      new RegExp(`^if ${variable}\\.include\\?\\(\\w+\\.name\\)$`),
      /^\w+\.build_settings\[['"]BUILD_LIBRARY_FOR_DISTRIBUTION['"]\] = ['"]YES['"]$/,
      /^end$/,
    ];
    for (let j = 0; j + branch.length <= lines.length; j++) {
      if (branch.every((re, k) => re.test(stripComment(lines[j + k]).trim()))) {
        removeRange(lines, j, j + branch.length - 1);
        break;
      }
    }
    i = start - 1;
  }
  return removed;
}

function removeResilientWorkaround(lines, result) {
  const a = removeResilientReadmeForm(lines);
  const b = removeResilientExampleForm(lines);
  if (a || b) {
    result.notes.push(
      'Removed the resilient-pods (BUILD_LIBRARY_FOR_DISTRIBUTION) workaround.'
    );
  }
  const text = lines.join('\n');
  const leftover =
    /zello_resilient_pods/.test(text) ||
    (/BUILD_LIBRARY_FOR_DISTRIBUTION/.test(text) &&
      RESILIENT_POD_NAMES.some((n) => text.includes(n)));
  if (leftover) {
    result.manual.push(
      'Found an unrecognised resilient-pods (BUILD_LIBRARY_FOR_DISTRIBUTION for PhoneNumberKit/SnowplowTracker/' +
        'CocoaLumberjack/PromisesSwift) workaround. It is not needed with SwiftPM; delete it by hand.'
    );
  }
}

// 3c -------------------------------------------------------------------------

function noteUseSpm(lines, result) {
  if (lines.some((l) => /ZELLO_USE_SPM/.test(stripComment(l)))) {
    result.manual.push(
      'Found `ZELLO_USE_SPM` in the Podfile. It is no longer read (SwiftPM is the only path); delete it by hand, and from any scripts/CI that set it.'
    );
  }
}

// 3d -------------------------------------------------------------------------

function ensurePlatform(lines, result) {
  const re = /^(\s*platform\s+:ios\s*,\s*)(.*?)(\s*#.*)?$/;
  const idx = lines.findIndex((l) => !COMMENT_RE.test(l) && re.test(l));
  if (idx === -1) {
    result.notes.push(
      `No \`platform :ios\` line found; make sure your deployment target is ${MIN_IOS} or later.`
    );
    return;
  }
  const m = re.exec(lines[idx]);
  const value = m[2].trim();
  const literal = /^(['"])(\d+(?:\.\d+)*)\1$/.exec(value);
  let replace = false;
  if (literal) {
    replace = compareVersions(literal[2], MIN_IOS) < 0;
  } else if (value === 'min_ios_version_supported') {
    replace = true;
  } else {
    result.notes.push(
      `\`${lines[idx].trim()}\` is not a literal version; make sure it resolves to ${MIN_IOS} or later.`
    );
    return;
  }
  if (replace) {
    lines[idx] = `${m[1]}'${MIN_IOS}'${m[3] || ''}`;
    result.notes.push(`Set \`platform :ios\` to '${MIN_IOS}'.`);
  }
}

// Target detection -----------------------------------------------------------

function scanTargets(lines) {
  const stack = [];
  const targets = [];
  lines.forEach((raw, index) => {
    const line = stripComment(raw);
    const code = line.trim();
    if (!code) {
      return;
    }
    const target =
      /^(abstract_)?target\s*\(?\s*['"]([^'"]+)['"]\s*\)?\s+do\b/.exec(code);
    if (target) {
      const node = {
        name: target[2],
        abstract: Boolean(target[1]),
        isTarget: true,
        start: index,
        body: [],
      };
      stack.push(node);
      targets.push({
        ...node,
        node,
        parents: stack.slice(0, -1).filter((n) => n.isTarget),
      });
      return;
    }
    if (/^end\b/.test(code)) {
      stack.pop();
      return;
    }
    if (
      /\bdo(\s*\|[^|]*\|)?$/.test(code) ||
      /^(if|unless|case|while|until|begin|def|class|module)\b/.test(code)
    ) {
      stack.push({ isTarget: false });
      return;
    }
    stack.forEach((n) => n.isTarget && n.body.push(code));
  });
  return targets;
}

function detectTargets(lines, result, options) {
  const all = scanTargets(lines);
  const topLevel = all.filter(
    (t) => !t.abstract && t.parents.every((p) => p.abstract)
  );
  let appTarget = options.appTarget;
  if (!appTarget) {
    const rn = topLevel.filter((t) =>
      t.node.body.some((c) => /^use_react_native!/.test(c))
    );
    const candidates = rn.length ? rn : topLevel.length === 1 ? topLevel : [];
    if (candidates.length !== 1) {
      result.manual.push(
        candidates.length === 0
          ? 'Could not determine the app target (no top-level `target` with `use_react_native!`). Pass --app-target.'
          : `More than one app target candidate (${candidates
              .map((t) => t.name)
              .join(', ')}). Pass --app-target.`
      );
    } else {
      appTarget = candidates[0].name;
    }
  }
  let extensionTargets = options.extensionTargets;
  if (!extensionTargets) {
    const others = topLevel
      .filter((t) => t.name !== appTarget)
      .map((t) => t.name);
    extensionTargets = others.filter((n) => EXTENSION_NAME_RE.test(n));
    const skipped = others.filter((n) => !extensionTargets.includes(n));
    if (skipped.length) {
      result.notes.push(
        `Not treated as extension targets: ${skipped.join(', ')}. ` +
          'Pass --extension-target <name> for every app extension that uses ZelloSDK.'
      );
    }
  }
  return { appTarget, extensionTargets };
}

// 3e / 3f --------------------------------------------------------------------

function insertRequire(lines, result) {
  if (
    lines.some(
      (l) => !COMMENT_RE.test(l) && l.includes('scripts/zello_pods.rb')
    )
  ) {
    return;
  }
  const idx = lines.findIndex((l) =>
    /^\s*prepare_react_native_project!/.test(l)
  );
  if (idx === -1) {
    result.manual.push(
      'Could not find `prepare_react_native_project!` to anchor the `zello_pods.rb` require. Add the require line manually.'
    );
    return;
  }
  const pad = idx > 0 && !BLANK_RE.test(lines[idx - 1]) ? [''] : [];
  lines.splice(idx, 0, ...pad, ...REQUIRE_LINES, '');
  result.notes.push('Added the `zello_pods.rb` require.');
}

function formatCall(variable, appTarget, extensionTargets) {
  const ext = extensionTargets.map((n) => `'${n}'`).join(', ');
  return `zello_post_install(${variable}, app_target: '${appTarget}', extension_targets: [${ext}])`;
}

function insertPostInstall(lines, result, options) {
  if (
    lines.some((l) => !COMMENT_RE.test(l) && /\bzello_post_install\(/.test(l))
  ) {
    return;
  }
  const re = /^(\s*)post_install\s+do\s*\|(\w+)\|\s*$/;
  const hits = lines
    .map((l, i) => (re.test(stripComment(l)) ? i : -1))
    .filter((i) => i >= 0);
  const { appTarget, extensionTargets } = detectTargets(lines, result, options);

  if (hits.length !== 1 || !appTarget) {
    if (hits.length !== 1) {
      result.manual.push(
        hits.length === 0
          ? 'No `post_install do |installer|` block found.'
          : 'More than one `post_install` block found.'
      );
    }
    const call = formatCall(
      'installer',
      appTarget || 'YourApp',
      extensionTargets || []
    );
    result.snippet = `post_install do |installer|\n  ${call}\n  # ...your existing post_install code...\nend`;
    return;
  }
  const m = re.exec(stripComment(lines[hits[0]]));
  lines.splice(
    hits[0] + 1,
    0,
    `${m[1]}  ${formatCall(m[2], appTarget, extensionTargets)}`
  );
  result.notes.push(
    `Added \`zello_post_install\` (app target: ${appTarget}; extension targets: ${
      extensionTargets.length ? extensionTargets.join(', ') : 'none'
    }).`
  );
}

// ----------------------------------------------------------------------------

/**
 * @param {string} source Podfile contents
 * @param {{appTarget?: string, extensionTargets?: string[]}} [options]
 * @returns {{content: string, changed: boolean, notes: string[], manual: string[], snippet?: string}}
 */
function transformPodfile(source, options = {}) {
  const result = { content: source, changed: false, notes: [], manual: [] };
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  const lines = source.split(/\r?\n/);

  removeZelloPods(lines, result);
  removeResilientWorkaround(lines, result);
  noteUseSpm(lines, result);
  ensurePlatform(lines, result);
  insertRequire(lines, result);
  insertPostInstall(lines, result, options);

  result.content = lines.join(eol);
  result.changed = result.content !== source;
  return result;
}

module.exports = {
  MIN_IOS,
  REQUIRE_LINES,
  transformPodfile,
  compareVersions,
};
