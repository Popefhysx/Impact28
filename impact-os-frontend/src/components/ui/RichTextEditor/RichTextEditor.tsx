'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { useState, useEffect, useCallback } from 'react';
import {
    Bold, Italic, Strikethrough, Code, List, ListOrdered,
    Link as LinkIcon, Heading1, Heading2, Heading3,
    Eye, Code2, Columns, Copy, Check, Sparkles
} from 'lucide-react';
import styles from './RichTextEditor.module.css';

export interface EditorVariable {
    name: string;
    description: string;
    required?: boolean;
}

export type EditorMode = 'visual' | 'code' | 'split';

export interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    mode?: EditorMode;
    onModeChange?: (mode: EditorMode) => void;
    variables?: EditorVariable[];
    placeholder?: string;
    className?: string;
    minHeight?: number;
}

export function RichTextEditor({
    value,
    onChange,
    mode: controlledMode,
    onModeChange,
    variables = [],
    placeholder = 'Start typing...',
    className = '',
    minHeight = 400,
}: RichTextEditorProps) {
    const [internalMode, setInternalMode] = useState<EditorMode>('split');
    const mode = controlledMode ?? internalMode;
    const setMode = onModeChange ?? setInternalMode;

    const [copiedVar, setCopiedVar] = useState<string | null>(null);
    const [codeValue, setCodeValue] = useState(value);

    // Tiptap editor for visual mode
    const editor = useEditor({
        extensions: [
            StarterKit,
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: styles.link,
                },
            }),
            Placeholder.configure({
                placeholder,
            }),
        ],
        content: value,
        immediatelyRender: false, // Required for Next.js SSR compatibility
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            onChange(html);
            setCodeValue(html);
        },
    });

    // Sync external value changes to editor
    useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value);
            setCodeValue(value);
        }
    }, [value, editor]);

    // Handle code mode changes
    const handleCodeChange = useCallback((newValue: string) => {
        setCodeValue(newValue);
        onChange(newValue);
        if (editor) {
            editor.commands.setContent(newValue);
        }
    }, [editor, onChange]);

    // Insert variable
    const insertVariable = useCallback((varName: string) => {
        const varString = `{{${varName}}}`;

        if (mode === 'code' || mode === 'split') {
            const textarea = document.getElementById('code-editor') as HTMLTextAreaElement;
            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const before = codeValue.substring(0, start);
                const after = codeValue.substring(end);
                const newValue = `${before}${varString}${after}`;
                handleCodeChange(newValue);
                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + varString.length, start + varString.length);
                }, 0);
            }
        } else if (editor) {
            editor.chain().focus().insertContent(varString).run();
        }
    }, [mode, codeValue, handleCodeChange, editor]);

    // Copy variable
    const copyVariable = useCallback((varName: string) => {
        navigator.clipboard.writeText(`{{${varName}}}`);
        setCopiedVar(varName);
        setTimeout(() => setCopiedVar(null), 2000);
    }, []);

    // Toolbar actions
    const ToolbarButton = ({
        onClick,
        isActive = false,
        children,
        title
    }: {
        onClick: () => void;
        isActive?: boolean;
        children: React.ReactNode;
        title: string;
    }) => (
        <button
            type="button"
            onClick={onClick}
            className={`${styles.toolbarButton} ${isActive ? styles.toolbarButtonActive : ''}`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className={`${styles.container} ${className}`}>
            {/* Variables Panel */}
            {variables.length > 0 && (
                <div className={styles.variablesPanel}>
                    <div className={styles.variablesHeader}>
                        <Sparkles size={14} />
                        <span>Variables</span>
                    </div>
                    <div className={styles.variablesList}>
                        {variables.map((v) => (
                            <button
                                key={v.name}
                                type="button"
                                className={styles.variableChip}
                                onClick={() => insertVariable(v.name)}
                                title={`${v.description}${v.required ? ' (required)' : ''}`}
                            >
                                <code>{`{{${v.name}}}`}</code>
                                {v.required && <span className={styles.requiredDot} />}
                                <span
                                    className={styles.copyIcon}
                                    onClick={(e) => { e.stopPropagation(); copyVariable(v.name); }}
                                >
                                    {copiedVar === v.name ? <Check size={10} /> : <Copy size={10} />}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Mode Tabs */}
            <div className={styles.modeTabs}>
                <button
                    type="button"
                    className={`${styles.modeTab} ${mode === 'code' ? styles.modeTabActive : ''}`}
                    onClick={() => setMode('code')}
                >
                    <Code2 size={14} />
                    Code
                </button>
                <button
                    type="button"
                    className={`${styles.modeTab} ${mode === 'visual' ? styles.modeTabActive : ''}`}
                    onClick={() => setMode('visual')}
                >
                    <Eye size={14} />
                    Visual
                </button>
                <button
                    type="button"
                    className={`${styles.modeTab} ${mode === 'split' ? styles.modeTabActive : ''}`}
                    onClick={() => setMode('split')}
                >
                    <Columns size={14} />
                    Split
                </button>
            </div>

            {/* Toolbar (Visual mode only) */}
            {(mode === 'visual') && editor && (
                <div className={styles.toolbar}>
                    <div className={styles.toolbarGroup}>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBold().run()}
                            isActive={editor.isActive('bold')}
                            title="Bold"
                        >
                            <Bold size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleItalic().run()}
                            isActive={editor.isActive('italic')}
                            title="Italic"
                        >
                            <Italic size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleStrike().run()}
                            isActive={editor.isActive('strike')}
                            title="Strikethrough"
                        >
                            <Strikethrough size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleCode().run()}
                            isActive={editor.isActive('code')}
                            title="Inline Code"
                        >
                            <Code size={16} />
                        </ToolbarButton>
                    </div>
                    <div className={styles.toolbarDivider} />
                    <div className={styles.toolbarGroup}>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                            isActive={editor.isActive('heading', { level: 1 })}
                            title="Heading 1"
                        >
                            <Heading1 size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                            isActive={editor.isActive('heading', { level: 2 })}
                            title="Heading 2"
                        >
                            <Heading2 size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                            isActive={editor.isActive('heading', { level: 3 })}
                            title="Heading 3"
                        >
                            <Heading3 size={16} />
                        </ToolbarButton>
                    </div>
                    <div className={styles.toolbarDivider} />
                    <div className={styles.toolbarGroup}>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleBulletList().run()}
                            isActive={editor.isActive('bulletList')}
                            title="Bullet List"
                        >
                            <List size={16} />
                        </ToolbarButton>
                        <ToolbarButton
                            onClick={() => editor.chain().focus().toggleOrderedList().run()}
                            isActive={editor.isActive('orderedList')}
                            title="Numbered List"
                        >
                            <ListOrdered size={16} />
                        </ToolbarButton>
                    </div>
                </div>
            )}

            {/* Editor Content */}
            <div
                className={`${styles.editorContent} ${styles[`editorContent${mode.charAt(0).toUpperCase() + mode.slice(1)}`]}`}
                style={{ minHeight }}
            >
                {/* Code Editor */}
                {(mode === 'code' || mode === 'split') && (
                    <div className={styles.codePane}>
                        <textarea
                            id="code-editor"
                            value={codeValue}
                            onChange={(e) => handleCodeChange(e.target.value)}
                            className={styles.codeEditor}
                            placeholder={placeholder}
                            spellCheck={false}
                        />
                    </div>
                )}

                {/* Visual Editor */}
                {mode === 'visual' && (
                    <div className={styles.visualPane}>
                        <EditorContent editor={editor} className={styles.tiptapEditor} />
                    </div>
                )}

                {/* Preview Pane (Split mode) */}
                {mode === 'split' && (
                    <div className={styles.previewPane}>
                        <div className={styles.previewHeader}>
                            <Eye size={14} />
                            <span>Preview</span>
                        </div>
                        <div className={styles.previewContent}>
                            <iframe
                                srcDoc={codeValue}
                                title="Preview"
                                className={styles.previewIframe}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
