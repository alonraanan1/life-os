# Connecting this project to GitHub

Today this repo's only git remote (`sites`) points at OpenAI's ChatGPT Sites hosting (`git.chatgpt-team.site`). That's fine for deploying through ChatGPT, but it isn't a place other AI tools (Claude, Cursor, GitHub Copilot, etc.) can read or write to. GitHub is the neutral, tool-agnostic option — virtually every AI coding tool knows how to clone, read, and push to a GitHub repo.

These steps need to be run on your own machine, in a terminal, because they use your own GitHub login. No AI tool can do this step for you — creating the repo and authenticating are things only you can do.

## 1. Create an empty repo on GitHub

Go to https://github.com/new, pick a name (e.g. `life-os`), choose Private or Public, and leave "Add a README", "Add .gitignore" and "Add a license" all **unchecked** (this project already has its own files). Click "Create repository" and copy the URL it shows you, e.g.:

```
https://github.com/<your-username>/life-os.git
```

If you already have the GitHub CLI (`gh`) installed and logged in, you can skip the website entirely — just run this from inside the project folder instead of steps 1 and 2:

```
gh repo create life-os --private --source=. --remote=origin --push
```

## 2. Add it as a remote and push (if you used the website in step 1)

Open a terminal in this project folder (`LifeOs`) and run:

```
git remote add origin https://github.com/<your-username>/life-os.git
git push -u origin main
```

The first push will prompt you to sign in to GitHub (a browser window or a device code, depending on how git is configured on your machine).

## 3. Check it worked

Refresh the GitHub repo page in your browser — you should see the project files there (`README.md`, `AGENTS.md`, `CHANGELOG.md`, `app/`, `components/`, etc.). `node_modules`, `.env`, and the build folders will be missing on purpose — `.gitignore` excludes them.

## Using the same repo from different AI tools

- **Claude / Cowork / Claude Code:** point a session at the GitHub repo (or keep working on the local `LifeOs` folder once it's linked to GitHub).
- **ChatGPT (Codex / connectors), Cursor, GitHub Copilot, etc.:** connect each tool to the same GitHub repo the way it normally supports (its repo connector, a `git clone`, or opening the local folder).
- Whichever tool you use, ask it to read `AGENTS.md`, `DESIGN.md`, and the latest entries in `CHANGELOG.md` before making changes, and to add a new `CHANGELOG.md` entry when it finishes. That's what lets the next AI session — on any tool — pick up exactly where the last one left off.

The existing `sites` remote can stay untouched if you still want to deploy through ChatGPT Sites from time to time — `origin` (GitHub) and `sites` (ChatGPT) can coexist as two remotes on the same repo. Push to whichever one you mean to update.
