import React from "react";
import {
  ButtonGroup,
  IconButton,
  Tooltip,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
} from "@chakra-ui/react";
import {
  FaBold,
  FaItalic,
  FaCode,
  FaLink,
  FaListUl,
  FaListOl,
  FaQuoteLeft,
  FaImage,
} from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";

const MarkdownToolbar = ({ onInsert, onImageClick, isUploadingImage }) => {
  // Toolbar actions that insert markdown syntax
  const actions = [
    {
      icon: <FaBold />,
      label: "Bold",
      action: () => onInsert("**", "**"),
    },
    {
      icon: <FaItalic />,
      label: "Italic",
      action: () => onInsert("*", "*"),
    },
    {
      icon: <FaCode />,
      label: "Inline Code",
      action: () => onInsert("`", "`"),
    },
    {
      icon: <FaLink />,
      label: "Link",
      action: () => onInsert("[", "](url)"),
    },
    {
      icon: <FaListUl />,
      label: "Bullet List",
      action: () => onInsert("\n- ", ""),
    },
    {
      icon: <FaListOl />,
      label: "Numbered List",
      action: () => onInsert("\n1. ", ""),
    },
    {
      icon: <FaQuoteLeft />,
      label: "Quote",
      action: () => onInsert("\n> ", ""),
    },
  ];

  // Separate image button that triggers file upload
  const imageButton = {
    icon: <FaImage />,
    label: isUploadingImage ? "Uploading..." : "Upload Image",
    action: onImageClick || (() => onInsert("![alt text](", ")")),
  };

  // Header options
  const insertHeader = (level) => {
    const hashes = "#".repeat(level);
    onInsert(`\n${hashes} `, "");
  };

  return (
    <HStack spacing={1} wrap="wrap">
      <ButtonGroup size="sm" variant="ghost">
        {/* Render action buttons */}
        {actions.map((action, index) => (
          <Tooltip key={index} label={action.label} placement="top">
            <IconButton
              icon={action.icon}
              onClick={action.action}
              aria-label={action.label}
            />
          </Tooltip>
        ))}

        {/* Image upload button */}
        <Tooltip label={imageButton.label} placement="top">
          <IconButton
            icon={imageButton.icon}
            onClick={imageButton.action}
            aria-label={imageButton.label}
            isLoading={isUploadingImage}
            colorScheme={onImageClick ? "blue" : undefined}
          />
        </Tooltip>

        {/* Header dropdown menu */}
        <Menu>
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            size="sm"
            variant="ghost"
          >
            Heading
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => insertHeader(1)}>
              # Heading 1
            </MenuItem>
            <MenuItem onClick={() => insertHeader(2)}>
              ## Heading 2
            </MenuItem>
            <MenuItem onClick={() => insertHeader(3)}>
              ### Heading 3
            </MenuItem>
            <MenuItem onClick={() => insertHeader(4)}>
              #### Heading 4
            </MenuItem>
          </MenuList>
        </Menu>

        {/* Code block button */}
        <Tooltip label="Code Block" placement="top">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onInsert("\n```\n", "\n```")}
          >
            {"</>"}
          </Button>
        </Tooltip>
      </ButtonGroup>
    </HStack>
  );
};

export default MarkdownToolbar;