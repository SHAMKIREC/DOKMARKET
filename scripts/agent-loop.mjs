#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import process from "node:process";

const MAX_ROUNDS = 5;
const PASS_SCORE = 9;
const CODEX_BIN = process.env.CODEX_BIN || "codex";
const MODEL = process.env.AGENT_LOOP_MODEL || "";

function fail(message) {
  console.error(`\n[agent-loop] ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const args = { task: "", taskFile: "", base: "HEAD" };
  for (let i = 0; i < argv.length; i += 1) {
    const value = argv[i];
    if (value === "--task") args.task = argv[++i] || "";
    else if (value === "--task-file") args.taskFile = argv[++i] || "";
    else if (value === "--base") args.base = argv[++i] || "HEAD";
    else if (value === "--help" || value === "-h") args.help = true;
    else if (!args.task) args.task = value;
  }
  return args;
}

function usage() {
  console.log(`\nДокМаркет: петля Builder → Reviewer → Auditor\n\nИспользование:\n  npm run agents -- --task "Сделай фичу ..."\n  npm run agents -- --task-file docs/tasks/feature.md\n\nПеременные окружения:\n  CODEX_BIN=codex\n  AGENT_LOOP_MODEL=<модель, если нужно зафиксировать>\n\nСкрипт запускает максимум ${MAX_ROUNDS} кругов. Reviewer и Auditor всегда стартуют отдельными процессами Codex с чистым контекстом и read-only sandbox.\n`);
}

async function run(command, args, { input = "", inherit = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: process.cwd(),
      env: process.env,
      stdio: inherit ? "inherit" : ["pipe", "pipe", "pipe"],
      shell: process.platform === "win32",
    });
    if (inherit) {
      child.on("error", reject);
      child.on("close", code => code === 0 ? resolve({ stdout: "", stderr: "" }) : reject(new Error(`${command} exited with ${code}`)));
      return;
    }
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", chunk => { stdout += chunk.toString(); });
    child.stderr.on("data", chunk => { stderr += chunk.toString(); });
    child.on("error", reject);
    child.on("close", code => {
      if (code !== 0) reject(new Error(`${command} exited with ${code}\n${stderr}`));
      else resolve({ stdout, stderr });
    });
    child.stdin.end(input);
  });
}

async function git(args) {
  return (await run("git", args)).stdout.trim();
}

async function ensureRepoReady() {
  await git(["rev-parse", "--show-toplevel"]);
  const conflicts = await git(["diff", "--name-only", "--diff-filter=U"]);
  if (conflicts) fail(`Сначала разреши конфликты Git:\n${conflicts}`);
}

async function getTask(args) {
  if (args.taskFile) return (await readFile(args.taskFile, "utf8")).trim();
  return args.task.trim();
}

function codexArgs(sandbox) {
  const args = ["exec", "--sandbox", sandbox, "-"];
  if (MODEL) args.splice(1, 0, "--model", MODEL);
  return args;
}

async function callAgent({ sandbox, prompt }) {
  const { stdout } = await run(CODEX_BIN, codexArgs(sandbox), { input: prompt });
  return stdout.trim();
}

async function currentDiff(base) {
  const diff = await git(["diff", "--no-ext-diff", "--unified=40", base, "--"]);
  const status = await git(["status", "--short"]);
  return { diff, status };
}

function extractScores(text) {
  const find = name => {
    const match = text.match(new RegExp(`${name}\\s*[:—-]\\s*(10|[1-9])`, "i"));
    return match ? Number(match[1]) : null;
  };
  return {
    correctness: find("корректность"),
    simplicity: find("простота"),
    risks: find("риски"),
  };
}

function minScore(...groups) {
  const values = groups.flatMap(group => Object.values(group)).filter(Number.isFinite);
  return values.length === 6 ? Math.min(...values) : null;
}

function builderPrompt({ task, round, reviewer = "", auditor = "" }) {
  const feedback = round === 1 ? "" : `\n\nЗамечания прошлого круга, которые надо исправить:\n\nREVIEWER:\n${reviewer}\n\nAUDITOR:\n${auditor}`;
  return `Ты Builder в проекте DOKMARKET. Это круг ${round}/${MAX_ROUNDS}.\n\nЗАДАЧА:\n${task}${feedback}\n\nСначала прочитай AGENTS.md и связанные файлы. Работай прямо в текущем репозитории. Ты единственный агент, которому разрешено менять код. Не коммить изменения и не пушь. Не трогай несвязанные файлы. Не маскируй старые ошибки.\n\nПосле правок запусти только релевантные проверки, доступные локально. В конце коротко напиши:\n1) какие файлы изменил;\n2) что изменил;\n3) какие проверки реально запускал и их результат;\n4) что не смог проверить.\n`;
}

function reviewerPrompt({ task, diff, status }) {
  return `Ты Reviewer. У тебя чистый контекст. Код менять запрещено.\n\nЗАДАЧА:\n${task}\n\nТЕКУЩИЙ GIT STATUS:\n${status || "чисто"}\n\nDIFF ДЛЯ ПРОВЕРКИ:\n${diff || "(diff пуст)"}\n\nПроверь только то, за что реально стоит платить: корректность фичи, простоту решения и реальные риски/регрессии. Не придирайся к вкусовщине. Каждое замечание обязано содержать файл, строку/диапазон строк (по diff, насколько возможно) и конкретно что сломается или почему это риск.\n\nВ конце обязательно поставь три оценки отдельными строками ровно в таком виде:\nКорректность: N\nПростота: N\nРиски: N\n\nОценка 9 или 10 допустима только если явно перечислишь, что именно проверено и почему это выдерживает задачу. Код не правь.`;
}

function auditorPrompt({ task, diff, status }) {
  return `Ты Auditor, третий независимый агент. У тебя чистый контекст. Ты НЕ видел оценок Reviewer. Код менять запрещено.\n\nЗАДАЧА:\n${task}\n\nТЕКУЩИЙ GIT STATUS:\n${status || "чисто"}\n\nDIFF ДЛЯ ПРОВЕРКИ:\n${diff || "(diff пуст)"}\n\nСделай независимое ревью. Ищи пропущенные функциональные проблемы, опасные допущения, безопасность, сломанные состояния и лишнюю сложность. Отдельно вычеркни придирки, за которые не стоит платить: косметику без влияния, вкусовщину, гипотетические абстракции без сценария поломки. Каждое реальное замечание — файл, строка/диапазон и конкретный сценарий поломки.\n\nВ конце обязательно поставь три оценки отдельными строками ровно в таком виде:\nКорректность: N\nПростота: N\nРиски: N\n\nОценка 9 или 10 должна быть обоснована тем, что ты проверил. Код не правь.`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return usage();
  const task = await getTask(args);
  if (!task) {
    usage();
    fail("Не указана задача.");
  }

  await ensureRepoReady();
  const base = await git(["rev-parse", args.base]);
  console.log(`[agent-loop] base: ${base}`);

  let reviewerFeedback = "";
  let auditorFeedback = "";

  for (let round = 1; round <= MAX_ROUNDS; round += 1) {
    console.log(`\n========== КРУГ ${round}/${MAX_ROUNDS} · BUILDER ==========`);
    const builder = await callAgent({ sandbox: "workspace-write", prompt: builderPrompt({ task, round, reviewer: reviewerFeedback, auditor: auditorFeedback }) });
    console.log(builder || "[Builder не оставил отчёт]");

    const snapshot = await currentDiff(base);
    if (!snapshot.diff) fail("Builder не создал diff. Задача не считается выполненной.");

    console.log(`\n========== КРУГ ${round}/${MAX_ROUNDS} · REVIEWER ==========`);
    reviewerFeedback = await callAgent({ sandbox: "read-only", prompt: reviewerPrompt({ task, ...snapshot }) });
    console.log(reviewerFeedback);
    const reviewerScores = extractScores(reviewerFeedback);

    console.log(`\n========== КРУГ ${round}/${MAX_ROUNDS} · AUDITOR ==========`);
    auditorFeedback = await callAgent({ sandbox: "read-only", prompt: auditorPrompt({ task, ...snapshot }) });
    console.log(auditorFeedback);
    const auditorScores = extractScores(auditorFeedback);

    const score = minScore(reviewerScores, auditorScores);
    if (score == null) fail("Не удалось прочитать все 6 оценок. Reviewer/Auditor должны вернуть Корректность, Простота и Риски от 1 до 10.");

    console.log(`\n[agent-loop] Итог круга: ${score}/10`);
    if (score >= PASS_SCORE) {
      console.log(`[agent-loop] PASS: минимальная из шести оценок ${score} ≥ ${PASS_SCORE}.`);
      console.log("[agent-loop] Изменения оставлены в рабочем дереве для твоего просмотра/коммита.");
      return;
    }

    if (round === MAX_ROUNDS) {
      console.log(`\n[agent-loop] STOP: достигнут лимит ${MAX_ROUNDS} кругов.`);
      console.log("[agent-loop] Где застряли — смотри последние замечания Reviewer и Auditor выше. Ничего не коммитилось автоматически.");
      process.exitCode = 2;
      return;
    }

    console.log(`[agent-loop] Ниже ${PASS_SCORE}: Builder получает оба списка замечаний, начинается новый круг.`);
  }
}

main().catch(error => fail(error?.stack || error?.message || String(error)));
