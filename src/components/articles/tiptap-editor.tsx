"use client";

import * as React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import TurndownService from "turndown";
import showdown from "showdown";

import { EditorToolbar } from "./editor-toolbar";
import { cn } from "@/lib/utils";

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  editable?: boolean;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
});

const markdownConverter = new showdown.Converter({
  tables: true,
  simplifiedAutoLink: true,
  strikethrough: true,
  tasklists: true,
});

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Start writing your article...",
  className,
  editable = true,
}: TiptapEditorProps) {
  const [isMarkdownMode, setIsMarkdownMode] = React.useState(false);
  const [markdownContent, setMarkdownContent] = React.useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4 hover:text-primary/80",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount,
    ],
    content: content ? markdownConverter.makeHtml(content) : "",
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose dark:prose-invert max-w-none",
          "focus:outline-none min-h-[400px] px-4 py-3",
          "prose-headings:font-semibold prose-headings:tracking-tight",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:leading-7 prose-li:leading-7",
          "prose-blockquote:border-l-2 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic"
        ),
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
  });

  const handleToggleMarkdown = React.useCallback(() => {
    if (!editor) return;

    if (isMarkdownMode) {
      // Convert markdown back to HTML and update editor
      const html = markdownConverter.makeHtml(markdownContent);
      editor.commands.setContent(html);
      setIsMarkdownMode(false);
    } else {
      // Convert HTML to markdown for editing
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      setMarkdownContent(markdown);
      setIsMarkdownMode(true);
    }
  }, [editor, isMarkdownMode, markdownContent]);

  const handleMarkdownChange = React.useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMarkdownContent(e.target.value);
      onChange(e.target.value);
    },
    [onChange]
  );

  const wordCount = React.useMemo(() => {
    if (isMarkdownMode) {
      return markdownContent.split(/\s+/).filter(Boolean).length;
    }
    return editor?.storage.characterCount.words() ?? 0;
  }, [editor, isMarkdownMode, markdownContent]);

  const characterCount = React.useMemo(() => {
    if (isMarkdownMode) {
      return markdownContent.length;
    }
    return editor?.storage.characterCount.characters() ?? 0;
  }, [editor, isMarkdownMode, markdownContent]);

  if (!editor) {
    return (
      <div className={cn("rounded-md border bg-background", className)}>
        <div className="h-12 border-b bg-muted/30" />
        <div className="min-h-[400px] animate-pulse bg-muted/10" />
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border bg-background", className)}>
      <EditorToolbar
        editor={editor}
        isMarkdownMode={isMarkdownMode}
        onToggleMarkdown={handleToggleMarkdown}
      />

      {isMarkdownMode ? (
        <textarea
          value={markdownContent}
          onChange={handleMarkdownChange}
          className={cn(
            "min-h-[400px] w-full resize-none bg-transparent px-4 py-3",
            "font-mono text-sm leading-relaxed",
            "focus:outline-none"
          )}
          placeholder={placeholder}
        />
      ) : (
        <EditorContent editor={editor} />
      )}

      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground">
        <div className="flex gap-4">
          <span>{wordCount.toLocaleString()} words</span>
          <span>{characterCount.toLocaleString()} characters</span>
        </div>
        <span className="text-muted-foreground/60">
          {isMarkdownMode ? "Markdown mode" : "Rich text mode"}
        </span>
      </div>
    </div>
  );
}

export { type TiptapEditorProps };
