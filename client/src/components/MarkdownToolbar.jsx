// client/src/components/MarkdownToolbar.jsx
import React from "react";
import { HStack, IconButton, Tooltip } from "@chakra-ui/react";
import { BiBold, BiItalic, BiCodeAlt } from "react-icons/bi";
import { FiList, FiHash } from "react-icons/fi";

/**
 * MarkdownToolbar
 * - onInsert(type) should insert the snippet at the caret in parent textarea.
 *
 * Types:
 *  - bold, italic, code, codeblock, list, heading
 */
const MarkdownToolbar = ({ onInsert }) => {
  return (
    <HStack spacing={2}>
      <Tooltip label="Bold (Ctrl/Cmd+B)">
        <IconButton aria-label="bold" size="sm" icon={<BiBold />} onClick={() => onInsert("bold")} />
      </Tooltip>
      <Tooltip label="Italic">
        <IconButton aria-label="italic" size="sm" icon={<BiItalic />} onClick={() => onInsert("italic")} />
      </Tooltip>
      <Tooltip label="Inline code">
        <IconButton aria-label="code" size="sm" icon={<BiCodeAlt />} onClick={() => onInsert("code")} />
      </Tooltip>
      <Tooltip label="Code block">
        <IconButton aria-label="codeblock" size="sm" icon={<FiHash />} onClick={() => onInsert("codeblock")} />
      </Tooltip>
      <Tooltip label="List">
        <IconButton aria-label="list" size="sm" icon={<FiList />} onClick={() => onInsert("list")} />
      </Tooltip>
    </HStack>
  );
};

export default MarkdownToolbar;
