import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Box, Text, Link, UnorderedList, OrderedList, ListItem, Heading, useColorModeValue } from '@chakra-ui/react';

const MarkdownPreview = ({ content }) => {
  const codeBg = useColorModeValue('gray.100', 'gray.700');
  const preBg = useColorModeValue('gray.50', 'gray.800');
  const blockquoteBorder = useColorModeValue('gray.300', 'gray.600');
  const tableBorder = useColorModeValue('gray.300', 'gray.600');
  const thBg = useColorModeValue('gray.50', 'gray.700');

  if (!content || content.trim() === '') {
    return (
      <Text color="gray.500" fontStyle="italic">
        Nothing to preview...
      </Text>
    );
  }

  // Check if content contains markdown syntax
  const hasMarkdownSyntax = /[*_`#\[\]()]/.test(content) || 
                           content.includes('```') || 
                           content.includes('---') ||
                           content.includes('|') ||
                           content.includes('- ') ||
                           content.includes('1. ');

  // If no markdown syntax, render as plain text with preserved line breaks
  if (!hasMarkdownSyntax) {
    return (
      <Text
        whiteSpace="pre-wrap"
        wordWrap="break-word"
        lineHeight="1.5"
        color="inherit"
      >
        {content}
      </Text>
    );
  }

  // If markdown syntax detected, render with react-markdown
  return (
    <Box
      color="inherit"
      sx={{
        '& h1': {
          fontSize: '1.5rem',
          fontWeight: 'bold',
          marginBottom: '0.5rem',
          marginTop: '0.5rem',
        },
        '& h2': {
          fontSize: '1.25rem',
          fontWeight: 'bold',
          marginBottom: '0.4rem',
          marginTop: '0.4rem',
        },
        '& h3': {
          fontSize: '1.1rem',
          fontWeight: 'bold',
          marginBottom: '0.3rem',
          marginTop: '0.3rem',
        },
        '& p': {
          marginBottom: '0.5rem',
          lineHeight: '1.5',
        },
        '& code': {
          backgroundColor: codeBg,
          padding: '0.2rem 0.4rem',
          borderRadius: '0.25rem',
          fontSize: '0.875rem',
          fontFamily: 'monospace',
        },
        '& pre': {
          backgroundColor: preBg,
          padding: '1rem',
          borderRadius: '0.5rem',
          overflow: 'auto',
          margin: '0.5rem 0',
        },
        '& ul, & ol': {
          marginLeft: '1.5rem',
          marginBottom: '0.5rem',
        },
        '& li': {
          marginBottom: '0.25rem',
        },
        '& a': {
          color: 'blue.500',
          textDecoration: 'underline',
        },
        '& a:hover': {
          color: 'blue.600',
        },
        '& blockquote': {
          borderLeft: '4px solid',
          borderLeftColor: blockquoteBorder,
          paddingLeft: '1rem',
          margin: '0.5rem 0',
          fontStyle: 'italic',
        },
        '& table': {
          borderCollapse: 'collapse',
          width: '100%',
          margin: '0.5rem 0',
        },
        '& th, & td': {
          border: '1px solid',
          borderColor: tableBorder,
          padding: '0.5rem',
          textAlign: 'left',
        },
        '& th': {
          backgroundColor: thBg,
          fontWeight: 'bold',
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <SyntaxHighlighter
                language={match[1]}
                PreTag="div"
                style={{
                  background: '#f6f8fa',
                  borderRadius: '6px',
                  padding: '16px',
                  fontSize: '14px',
                  lineHeight: '1.45',
                }}
                {...props}
              >
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          h1: ({ children }) => <Heading as="h1" size="lg">{children}</Heading>,
          h2: ({ children }) => <Heading as="h2" size="md">{children}</Heading>,
          h3: ({ children }) => <Heading as="h3" size="sm">{children}</Heading>,
          ul: ({ children }) => <UnorderedList>{children}</UnorderedList>,
          ol: ({ children }) => <OrderedList>{children}</OrderedList>,
          li: ({ children }) => <ListItem>{children}</ListItem>,
          a: ({ href, children }) => (
            <Link href={href} isExternal color="blue.500">
              {children}
            </Link>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownPreview;

