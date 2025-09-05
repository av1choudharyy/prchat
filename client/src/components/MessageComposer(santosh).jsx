import { useState, useCallback } from "react";
import {
  Box,
  HStack,
  IconButton,
  Select,
  Textarea,
  Button,
  Tooltip,
  Divider,
  useColorModeValue,
} from "@chakra-ui/react";
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined, MdSend, MdClear } from "react-icons/md";

const FONT_SIZES = ["14px", "16px", "18px", "20px", "24px"];

export default function MessageComposer({ onSend, isSending = false, placeholder = "Type a message…" }) {
  const [value, setValue] = useState("");
  const [style, setStyle] = useState({
    fontWeight: "normal",
    fontStyle: "normal",
    textDecoration: "none",
    fontSize: "16px",
  });

  const toggle = useCallback((key, onVal, offVal) => {
    setStyle((s) => ({ ...s, [key]: s[key] === onVal ? offVal : onVal }));
  }, []);

  const handleSend = useCallback(() => {
    const content = value.trim();
    if (!content) return;
    // Send content + styles to parent
    onSend?.({ content, styles: style });
    setValue(""); // keep current style toggles for convenience
  }, [onSend, value, style]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toolbarBg = useColorModeValue("gray.50", "gray.700");
  const inputBg = useColorModeValue("white", "gray.800");
  const borderCol = useColorModeValue("gray.200", "gray.600");

  return (
    <Box borderTop="1px solid" borderColor={borderCol}>
      {/* Toolbar */}
      <HStack p={2} spacing={2} bg={toolbarBg}>
        <Tooltip label="Bold" hasArrow>
          <IconButton
            aria-label="Bold"
            icon={<MdFormatBold />}
            variant={style.fontWeight === "bold" ? "solid" : "ghost"}
            onClick={() => toggle("fontWeight", "bold", "normal")}
            size="sm"
          />
        </Tooltip>
        <Tooltip label="Italic" hasArrow>
          <IconButton
            aria-label="Italic"
            icon={<MdFormatItalic />}
            variant={style.fontStyle === "italic" ? "solid" : "ghost"}
            onClick={() => toggle("fontStyle", "italic", "normal")}
            size="sm"
          />
        </Tooltip>
        <Tooltip label="Underline" hasArrow>
          <IconButton
            aria-label="Underline"
            icon={<MdFormatUnderlined />}
            variant={style.textDecoration === "underline" ? "solid" : "ghost"}
            onClick={() => toggle("textDecoration", "underline", "none")}
            size="sm"
          />
        </Tooltip>

        <Select
          size="sm"
          maxW="120px"
          value={style.fontSize}
          onChange={(e) => setStyle((s) => ({ ...s, fontSize: e.target.value }))}
        >
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>

        <IconButton
          aria-label="Clear formatting"
          title="Clear formatting"
          icon={<MdClear />}
          variant="ghost"
          size="sm"
          onClick={() =>
            setStyle({ fontWeight: "normal", fontStyle: "normal", textDecoration: "none", fontSize: "16px" })
          }
        />
      </HStack>

      <Divider />

      {/* Input + Send */}
      <HStack p={2} spacing={2} align="flex-end" bg={inputBg}>
        <Textarea
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          resize="none"
          rows={2}
          fontWeight={style.fontWeight}
          fontStyle={style.fontStyle}
          textDecoration={style.textDecoration}
          fontSize={style.fontSize}
          bg={inputBg}
        />
        <Button
          rightIcon={<MdSend />}
          colorScheme="blue"
          isDisabled={!value.trim()}
          isLoading={isSending}
          onClick={handleSend}
        >
          Send
        </Button>
      </HStack>
    </Box>
  );
}
