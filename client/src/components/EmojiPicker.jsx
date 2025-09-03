import { useState } from "react";
import { Box, IconButton } from "@chakra-ui/react";
import EmojiPicker from "emoji-picker-react";

const EmojiPickerComponent = ({ onEmojiClick, isOpen, onToggle }) => {
    return (
        <Box position="relative">
            <IconButton
                aria-label="Add emoji"
                icon={<span style={{ fontSize: "20px" }}>😀</span>}
                size="sm"
                variant="ghost"
                onClick={onToggle}
                _hover={{ bg: "gray.100" }}
            />

            {isOpen && (
                <Box
                    position="absolute"
                    bottom="40px"
                    right="0"
                    zIndex="1000"
                    boxShadow="lg"
                    borderRadius="md"
                    bg="white"
                    border="1px solid"
                    borderColor="gray.200"
                >
                    <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        width={300}
                        height={400}
                        previewConfig={{
                            showPreview: false
                        }}
                        skinTonesDisabled
                        searchDisabled={false}
                    />
                </Box>
            )}
        </Box>
    );
};

export default EmojiPickerComponent;
