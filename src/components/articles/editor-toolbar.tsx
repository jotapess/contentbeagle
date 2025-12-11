"use client";

import * as React from "react";
import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Unlink,
  Undo,
  Redo,
  Code,
  FileCode,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditorToolbarProps {
  editor: Editor;
  isMarkdownMode: boolean;
  onToggleMarkdown: () => void;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "size-8 p-0",
            isActive && "bg-muted text-foreground"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function LinkButton({ editor }: { editor: Editor }) {
  const [url, setUrl] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const handleSetLink = React.useCallback(() => {
    if (url) {
      editor
        .chain()
        .focus()
        .extendMarkRange("link")
        .setLink({ href: url })
        .run();
    }
    setUrl("");
    setOpen(false);
  }, [editor, url]);

  const handleRemoveLink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setOpen(false);
  }, [editor]);

  React.useEffect(() => {
    if (open) {
      const previousUrl = editor.getAttributes("link").href;
      setUrl(previousUrl || "");
    }
  }, [open, editor]);

  const isActive = editor.isActive("link");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("size-8 p-0", isActive && "bg-muted text-foreground")}
            >
              <LinkIcon className="size-4" />
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          Insert link
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80" align="start">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Link</h4>
            <p className="text-sm text-muted-foreground">
              Enter the URL for this link.
            </p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link-url">URL</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSetLink();
                }
              }}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSetLink}>
              {isActive ? "Update" : "Add"} Link
            </Button>
            {isActive && (
              <Button size="sm" variant="outline" onClick={handleRemoveLink}>
                <Unlink className="mr-1.5 size-3.5" />
                Remove
              </Button>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function EditorToolbar({
  editor,
  isMarkdownMode,
  onToggleMarkdown,
}: EditorToolbarProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-0.5 border-b bg-muted/30 px-2 py-1.5">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          disabled={isMarkdownMode}
          tooltip="Bold (Ctrl+B)"
        >
          <Bold className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          disabled={isMarkdownMode}
          tooltip="Italic (Ctrl+I)"
        >
          <Italic className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          disabled={isMarkdownMode}
          tooltip="Strikethrough"
        >
          <Strikethrough className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          disabled={isMarkdownMode}
          tooltip="Inline code"
        >
          <Code className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          disabled={isMarkdownMode}
          tooltip="Heading 1"
        >
          <Heading1 className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          disabled={isMarkdownMode}
          tooltip="Heading 2"
        >
          <Heading2 className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          disabled={isMarkdownMode}
          tooltip="Heading 3"
        >
          <Heading3 className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          disabled={isMarkdownMode}
          tooltip="Bullet list"
        >
          <List className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          disabled={isMarkdownMode}
          tooltip="Numbered list"
        >
          <ListOrdered className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          disabled={isMarkdownMode}
          tooltip="Blockquote"
        >
          <Quote className="size-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {!isMarkdownMode && <LinkButton editor={editor} />}

        <Separator orientation="vertical" className="mx-1 h-6" />

        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo() || isMarkdownMode}
          tooltip="Undo (Ctrl+Z)"
        >
          <Undo className="size-4" />
        </ToolbarButton>

        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo() || isMarkdownMode}
          tooltip="Redo (Ctrl+Y)"
        >
          <Redo className="size-4" />
        </ToolbarButton>

        <div className="ml-auto">
          <ToolbarButton
            onClick={onToggleMarkdown}
            isActive={isMarkdownMode}
            tooltip={isMarkdownMode ? "Switch to rich text" : "Switch to markdown"}
          >
            <FileCode className="size-4" />
          </ToolbarButton>
        </div>
      </div>
    </TooltipProvider>
  );
}
