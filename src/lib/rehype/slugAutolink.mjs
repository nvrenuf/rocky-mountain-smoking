import GithubSlugger from 'github-slugger';
import { toText } from 'hast-util-to-text';
import { visit } from 'unist-util-visit';

const headingTagNames = new Set(['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);

export function rehypeSlug() {
  return (tree) => {
    const slugger = new GithubSlugger();

    visit(tree, 'element', (node) => {
      if (!headingTagNames.has(node.tagName)) {
        return;
      }

      const text = toText(node).trim();
      if (!text) {
        return;
      }

      if (!node.properties) {
        node.properties = {};
      }

      if (!node.properties.id) {
        node.properties.id = slugger.slug(text);
      }
    });
  };
}

export function rehypeAutolinkHeadings(options = {}) {
  const { behavior = 'append' } = options;

  return (tree) => {
    visit(tree, 'element', (node) => {
      if (!headingTagNames.has(node.tagName)) {
        return;
      }

      const id = node.properties?.id;
      if (!id) {
        return;
      }

      const existingAnchor = node.children?.find(
        (child) =>
          child.type === 'element' &&
          child.tagName === 'a' &&
          Array.isArray(child.properties?.className) &&
          child.properties.className.includes('heading-anchor')
      );

      if (existingAnchor) {
        return;
      }

      const anchor = {
        type: 'element',
        tagName: 'a',
        properties: {
          href: `#${id}`,
          className: ['heading-anchor'],
          'aria-hidden': 'true',
          tabIndex: -1,
        },
        children: [{ type: 'text', value: '#' }],
      };

      if (behavior === 'prepend') {
        node.children = [anchor, ...(node.children ?? [])];
      } else if (behavior === 'wrap') {
        node.children = [
          {
            type: 'element',
            tagName: 'a',
            properties: {
              href: `#${id}`,
              className: ['heading-anchor', 'heading-anchor-wrap'],
            },
            children: node.children ?? [],
          },
        ];
      } else {
        node.children = [...(node.children ?? []), anchor];
      }
    });
  };
}
