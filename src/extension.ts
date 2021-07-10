"use strict"
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode"
import { CompletionItemProvider, HoverProvider } from "./directivesCompletion"
import frontMatterPlugin from "markdown-it-front-matter"
import footnotePlugin from "markdown-it-footnote"
import docutilsPlugin from "markdown-it-docutils"
import type MarkdownIt from "markdown-it"
import dollarmathPlugin from "markdown-it-dollarmath"
import amsmathPlugin from "markdown-it-amsmath"
import deflistPlugin from "markdown-it-deflist"
import tasklistPlugin from "markdown-it-task-lists"
import { renderToString } from "katex"
import { colonFencePlugin, convertFrontMatter, mystBlockPlugin } from "./mdPlugins"

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log("Activated MyST-Markdown extension")

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with  registerCommand
  // The commandId parameter must match the command field in package.json
  const disposable = vscode.commands.registerCommand("myst.Activate", () => {
    // The code you place here will be executed every time your command is executed
    // Display a message box to the user
    void vscode.window.showInformationMessage("Activated MyST-Markdown!")
  })

  context.subscriptions.push(disposable)

  const mdSelector: vscode.DocumentSelector = { scheme: "file", language: "markdown" }

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      mdSelector,
      new CompletionItemProvider(),
      "{"
    )
  )
  context.subscriptions.push(
    vscode.languages.registerHoverProvider(mdSelector, new HoverProvider())
  )

  if (!vscode.workspace.getConfiguration("myst.preview").get("enable", true)) {
    return {}
  }
  return {
    extendMarkdownIt(md: MarkdownIt) {
      // note ideally here, we would want to specify the config as commonmark, rather than default
      const extensions: string[] = vscode.workspace
        .getConfiguration("myst.preview")
        .get("extensions", [])
      let newMd = md
        .enable("table")
        .use(frontMatterPlugin, () => {})
        .use(convertFrontMatter)
        .use(mystBlockPlugin)
        .use(footnotePlugin)
        .disable("footnote_inline") // not yet implemented in myst-parser
        .use(docutilsPlugin)

      if (extensions.includes("dollarmath")) {
        newMd = newMd.use(dollarmathPlugin, {
          double_inline: true,
          renderer: renderToString,
          optionsInline: { throwOnError: false, displayMode: false },
          optionsBlock: { throwOnError: false, displayMode: true }
        })
      }
      if (extensions.includes("colon_fence")) {
        newMd = newMd.use(colonFencePlugin)
      }
      if (extensions.includes("amsmath")) {
        newMd = newMd.use(amsmathPlugin, {
          renderer: renderToString,
          options: { throwOnError: false, displayMode: true }
        })
      }
      if (extensions.includes("deflist")) {
        newMd = newMd.use(deflistPlugin)
      }
      if (extensions.includes("tasklist")) {
        newMd = newMd.use(tasklistPlugin)
      }
      // TODO substitutions
      return newMd
    }
  }
}

// this method is called when your extension is deactivated
export function deactivate() {}
