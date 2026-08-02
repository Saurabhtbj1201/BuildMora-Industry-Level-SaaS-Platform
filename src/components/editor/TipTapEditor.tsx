"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Bold, Italic, Code, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImageIcon,
  Undo, Redo, Sparkles, Loader2,
} from "lucide-react";

export interface TipTapEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  onAiPrompt?: (promptType: string) => Promise<string | void>;
}

export function TipTapEditor({
  value,
  onChange,
  placeholder = "Write something incredible...",
  className,
  onAiPrompt,
}: TipTapEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline font-medium" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full my-4 border border-border" },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert max-w-none min-h-[220px] p-4 focus:outline-none text-foreground text-sm leading-relaxed",
      },
    },
  });

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetMark("link").run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleAiAction = async (promptType: string) => {
    if (!onAiPrompt) return;
    setIsGenerating(true);
    try {
      const generatedText = await onAiPrompt(promptType);
      if (generatedText) {
        editor.chain().focus().insertContent(generatedText).run();
      }
    } catch (e) {
      console.error("AI Generation error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("border border-border rounded-xl bg-card overflow-hidden focus-within:ring-1 focus-within:ring-primary/50 transition-all", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-muted/40 border-b border-border text-foreground">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("bold") && "bg-primary/20 text-primary")}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("italic") && "bg-primary/20 text-primary")}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("code") && "bg-primary/20 text-primary")}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("heading", { level: 1 }) && "bg-primary/20 text-primary")}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("heading", { level: 2 }) && "bg-primary/20 text-primary")}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("heading", { level: 3 }) && "bg-primary/20 text-primary")}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("bulletList") && "bg-primary/20 text-primary")}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("orderedList") && "bg-primary/20 text-primary")}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("blockquote") && "bg-primary/20 text-primary")}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={setLink}
          className={cn("p-1.5 rounded hover:bg-muted transition-colors", editor.isActive("link") && "bg-primary/20 text-primary")}
          title="Insert Link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={addImage}
          className="p-1.5 rounded hover:bg-muted transition-colors"
          title="Insert Image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-border mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-40"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-muted transition-colors disabled:opacity-40"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>

        {/* AI Generator floating trigger */}
        {onAiPrompt && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => handleAiAction("project_description")}
              className="flex items-center gap-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 px-2.5 py-1 rounded-md font-medium transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              AI Assist
            </button>
          </div>
        )}
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
