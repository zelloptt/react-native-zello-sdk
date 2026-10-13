#!/usr/bin/env node
'use strict';

/**
 * One-time iOS setup for @zelloptt/react-native-zello-sdk:
 *   npx @zelloptt/react-native-zello-sdk setup-ios [options]
 *
 * Migrates the app's Podfile to the SwiftPM-based native ZelloSDK. Never touches .xcodeproj
 * (the `zello_post_install` Podfile helper owns that). Exit codes: 0 applied/no-op,
 * 1 error, 2 manual step required.
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');
const { transformPodfile, REQUIRE_LINES } = require('./podfile-transform');

const USAGE = `Usage: react-native-zello-sdk setup-ios [options]

Options:
  --podfile <path>            Podfile to migrate (default: <project-root>/ios/Podfile)
  --project-root <dir>        React Native project root (default: current directory)
  --app-target <name>         App target (default: detected)
  --extension-target <name>   Extension target, repeatable (default: detected)
  --dry-run                   Print the diff, write nothing
  --yes                       Apply without asking for confirmation
  -h, --help                  Show this help
`;

function parseArgs(argv) {
  const opts = { extensionTargets: [] };
  const args = argv.slice();
  const value = (flag) => {
    const v = args.shift();
    if (v === undefined || v.startsWith('--')) {
      throw new Error(`${flag} requires a value`);
    }
    return v;
  };
  while (args.length) {
    const arg = args.shift();
    switch (arg) {
      case 'setup-ios':
        opts.command = 'setup-ios';
        break;
      case '--podfile':
        opts.podfile = value(arg);
        break;
      case '--project-root':
        opts.projectRoot = value(arg);
        break;
      case '--app-target':
        opts.appTarget = value(arg);
        break;
      case '--extension-target':
        opts.extensionTargets.push(value(arg));
        break;
      case '--dry-run':
        opts.dryRun = true;
        break;
      case '--yes':
      case '-y':
        opts.yes = true;
        break;
      case '-h':
      case '--help':
        opts.help = true;
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return opts;
}

/** Minimal unified diff (LCS based; Podfiles are small). */
function unifiedDiff(before, after, label) {
  const a = before.split('\n');
  const b = after.split('\n');
  const dp = Array.from({ length: a.length + 1 }, () =>
    new Array(b.length + 1).fill(0)
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      ops.push([' ', a[i]]);
      i++;
      j++;
    } else if (
      j < b.length &&
      (i === a.length || dp[i][j + 1] >= dp[i + 1][j])
    ) {
      ops.push(['+', b[j++]]);
    } else {
      ops.push(['-', a[i++]]);
    }
  }
  const context = 3;
  const keep = ops.map((_, k) =>
    ops
      .slice(Math.max(0, k - context), k + context + 1)
      .some(([u]) => u !== ' ')
  );
  const out = [`--- a/${label}`, `+++ b/${label}`];
  let inHunk = false;
  ops.forEach(([t, line], k) => {
    if (keep[k]) {
      if (!inHunk) {
        out.push('@@');
        inHunk = true;
      }
      out.push(t + line);
    } else {
      inHunk = false;
    }
  });
  return out.join('\n');
}

function ask(question, io) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: io.stdin, output: io.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

/**
 * @returns {Promise<number>} exit code
 */
async function main(argv, io = {}) {
  const out = io.stdout || process.stdout;
  const err = io.stderr || process.stderr;
  const cwd = io.cwd || process.cwd();
  const log = (s) => out.write(`${s}\n`);
  const fail = (s) => err.write(`${s}\n`);

  let opts;
  try {
    opts = parseArgs(argv);
  } catch (e) {
    fail(`${e.message}\n\n${USAGE}`);
    return 1;
  }
  if (opts.help || (!opts.command && argv.length === 0)) {
    log(USAGE);
    return 0;
  }
  if (!opts.command) {
    fail(`Missing command \`setup-ios\`.\n\n${USAGE}`);
    return 1;
  }

  const root = path.resolve(cwd, opts.projectRoot || '.');
  const podfile = path.resolve(
    cwd,
    opts.podfile || path.join(root, 'ios', 'Podfile')
  );
  if (!fs.existsSync(podfile)) {
    fail(
      `Podfile not found at ${podfile}.\n` +
        'Run this from your React Native project root, or pass --project-root <dir> / --podfile <path> (monorepos).'
    );
    return 1;
  }

  const source = fs.readFileSync(podfile, 'utf8');
  const result = transformPodfile(source, {
    appTarget: opts.appTarget,
    extensionTargets: opts.extensionTargets.length
      ? opts.extensionTargets
      : undefined,
  });

  if (result.manual.length) {
    fail(`Manual step required; ${podfile} was not modified:`);
    result.manual.forEach((m) => fail(`  - ${m}`));
    if (result.snippet) {
      fail(`\nAdd this to your Podfile:\n\n${result.snippet}\n`);
    }
    fail(
      'Also add the require line before `prepare_react_native_project!`:\n\n' +
        REQUIRE_LINES.join('\n') +
        '\n'
    );
    return 2;
  }

  result.notes.forEach((n) => log(`- ${n}`));
  if (!result.changed) {
    log('Podfile is already set up. Nothing to do.');
    return 0;
  }

  log(
    `\n${unifiedDiff(source, result.content, path.relative(cwd, podfile) || podfile)}\n`
  );
  if (opts.dryRun) {
    log('Dry run: no files written.');
    return 0;
  }
  if (!opts.yes) {
    if (!io.stdin && !process.stdin.isTTY) {
      fail(
        'Refusing to modify the Podfile without confirmation. Re-run with --yes (or --dry-run to preview).'
      );
      return 1;
    }
    if (
      !(await ask('Apply these changes? [y/N] ', {
        stdin: io.stdin || process.stdin,
        stdout: out,
      }))
    ) {
      log('Aborted; no files written.');
      return 1;
    }
  }
  fs.writeFileSync(podfile, result.content);
  log(`Updated ${podfile}. Next: run \`bundle exec pod install\` in ios/.`);
  return 0;
}

module.exports = { main, parseArgs, unifiedDiff };

if (require.main === module) {
  main(process.argv.slice(2)).then(
    (code) => {
      process.exitCode = code;
    },
    (e) => {
      process.stderr.write(`${e.stack || e}\n`);
      process.exitCode = 1;
    }
  );
}
