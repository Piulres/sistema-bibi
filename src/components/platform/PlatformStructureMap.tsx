import Link from "next/link";
import type { PlatformTreeNode } from "@/lib/platform/structure";

type Props = {
  root: PlatformTreeNode;
  title?: string;
  description?: string;
};

function TreeNode({ node, depth = 0 }: { node: PlatformTreeNode; depth?: number }) {
  const hasChildren = node.children && node.children.length > 0;

  return (
    <li className="relative">
      <div
        className="flex flex-col gap-0.5 py-2"
        style={{ paddingLeft: depth > 0 ? `${depth * 1.25}rem` : 0 }}
      >
        {node.href ? (
          <Link
            href={node.href}
            className="inline-flex w-fit items-center gap-2 font-medium text-[var(--text-primary)] underline-offset-4 hover:text-[var(--brand-accent)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring-focus)]"
          >
            {depth === 0 && (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-[var(--brand-accent)]"
                aria-hidden
              />
            )}
            {node.label}
          </Link>
        ) : (
          <span
            className={`${depth === 0 ? "text-lg font-semibold" : depth === 1 ? "font-semibold text-[var(--text-primary)]" : "font-medium text-[var(--text-secondary)]"}`}
          >
            {node.label}
          </span>
        )}
        {node.description && (
          <p className="text-sm text-[var(--text-muted)]">{node.description}</p>
        )}
      </div>
      {hasChildren && (
        <ul className="border-l border-[var(--border-accent)]">
          {node.children!.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PlatformStructureMap({ root, title, description }: Props) {
  return (
    <section aria-labelledby="platform-structure-heading">
      {title && (
        <div className="mb-8">
          <h2
            id="platform-structure-heading"
            className="text-2xl font-bold tracking-tight text-[var(--text-primary)]"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-2 max-w-3xl text-[var(--text-secondary)]">{description}</p>
          )}
        </div>
      )}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--surface-card)] p-6 shadow-sm sm:p-8">
        <ul>
          <TreeNode node={root} />
        </ul>
      </div>
    </section>
  );
}
