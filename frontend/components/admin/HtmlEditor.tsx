"use client";

import { useRef, useEffect, useCallback } from "react";

type HtmlEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
};

const TOOLBAR_BUTTONS = [
  { cmd: "bold", label: "B", title: "Bold" },
  { cmd: "italic", label: "I", title: "Italic" },
  { cmd: "underline", label: "U", title: "Underline" },
  { cmd: "separator" },
  { cmd: "insertUnorderedList", label: "• List", title: "Bullet list" },
  { cmd: "insertOrderedList", label: "1. List", title: "Numbered list" },
  { cmd: "separator" },
  { cmd: "formatBlock", value: "p", label: "P", title: "Paragraph" },
  { cmd: "formatBlock", value: "h2", label: "H2", title: "Heading 2" },
  { cmd: "formatBlock", value: "h3", label: "H3", title: "Heading 3" },
  { cmd: "separator" },
  { cmd: "createLink", label: "Link", title: "Insert link" },
  { cmd: "unlink", label: "Unlink", title: "Remove link" },
] as const;

function execCommand(cmd: string, value?: string) {
  if (cmd === "separator") return;
  document.execCommand(cmd, false, value ?? undefined);
}

export default function HtmlEditor({
  value,
  onChange,
  placeholder = "Enter description...",
  minHeight = "120px",
  className = "",
}: HtmlEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  const emitChange = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    const html = el.innerHTML;
    if (html === "<br>" || html === "<br/>") {
      onChange("");
      return;
    }
    isInternalChange.current = true;
    onChange(html);
  }, [onChange]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    if (el.innerHTML !== value) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const handleToolbarClick = (btn: (typeof TOOLBAR_BUTTONS)[number]) => {
    if (btn.cmd === "separator") return;
    editorRef.current?.focus();
    if (btn.cmd === "createLink") {
      const url = window.prompt("Enter URL:");
      if (url) execCommand("createLink", url);
      return;
    }
    if (btn.cmd === "formatBlock" && btn.value) {
      execCommand("formatBlock", btn.value);
      return;
    }
    execCommand(btn.cmd);
  };

  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1">
        {TOOLBAR_BUTTONS.map((btn, i) =>
          btn.cmd === "separator" ? (
            <span key={i} className="mx-1 w-px self-stretch bg-slate-300" aria-hidden />
          ) : (
            <button
              key={i}
              type="button"
              title={btn.title}
              onClick={() => handleToolbarClick(btn)}
              className="rounded px-2 py-1 text-sm font-medium text-slate-700 hover:bg-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {btn.label}
            </button>
          )
        )}
      </div>
      <div className="relative">
        {!value && (
          <div
            className="pointer-events-none absolute left-4 top-2 text-slate-400"
            aria-hidden
          >
            {placeholder}
          </div>
        )}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={emitChange}
          onBlur={emitChange}
          className="min-w-0 px-4 py-2 text-slate-900 outline-none [&_ul]:list-inside [&_ul]:list-disc [&_ol]:list-inside [&_ol]:list-decimal [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_a]:text-amber-600 [&_a]:underline [&_a]:hover:text-amber-700"
          style={{ minHeight }}
        />
      </div>
    </div>
  );
}
