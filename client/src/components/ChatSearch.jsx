import React, { useEffect, useState } from "react";
import {
  SearchIcon,
  CloseIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "@chakra-ui/icons";
import { Box, Input } from "@chakra-ui/react";

function ChatSearch({ messages, searchQuery, setSearchQuery, onScrollToMessage, setSelectedMessageIndex }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [matches, setMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);

  // Find matches whenever query changes
  useEffect(() => {
    if (!searchQuery) {
      setMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    const newMatches = messages
      .map((msg, idx) =>
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ? idx : null
      )
      .filter((idx) => idx !== null);

    setMatches(newMatches);
    setCurrentMatchIndex(newMatches.length > 0 ? 0 : -1);
  }, [searchQuery, messages]);

  // Scroll to the active match
  useEffect(() => {
    if (currentMatchIndex !== -1 && matches.length > 0) {
      onScrollToMessage(matches[currentMatchIndex]);
    }
  }, [currentMatchIndex, matches, onScrollToMessage]);

  useEffect(() => {
    if (currentMatchIndex !== -1 && matches.length > 0) {
      const selectedIdx = matches[currentMatchIndex];
      onScrollToMessage(selectedIdx);
      setSelectedMessageIndex(selectedIdx); // ✅ update parent
    } else {
      setSelectedMessageIndex(null); // reset when no search
    }
  }, [currentMatchIndex, matches, onScrollToMessage, setSelectedMessageIndex]);

  const handleNext = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  };

  const handlePrev = () => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  };

  return (
    <Box className="flex items-center gap-2 p-2 border-b bg-white shadow" style={{ marginRight: "1rem" }}>
      {!searchOpen ? (
        <button onClick={() => setSearchOpen(true)} data-testid="search-button">
          <SearchIcon w={5} h={5} color="gray.600" />
        </button>
      ) : (
        <Box style={{ display: "flex", alignItems: "center" }}>
          {/* Controlled input */}
          <Input
            id="search"
            type="text"
            placeholder="Search..."
            variant="flushed"
            focusBorderColor="grey"
            borderBottom="1px solid"
            borderColor="gray.400"
            marginRight="1rem"
            width="20rem"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Box style={{ display: "flex", border: "1px solid #cccccc", alignItems: "center", marginRight: "0.5rem", paddingLeft: "0.2rem" }}>
            <span className="text-sm text-gray-500" style={{ fontSize: "1.3rem" }}>
              {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : "0/0"}
            </span>
            <button onClick={handlePrev}>
              <ChevronUpIcon w={5} h={5} color="gray.600" />
            </button>
            <button onClick={handleNext}>
              <ChevronDownIcon w={5} h={5} color="gray.600" />
            </button>
          </Box>
          <button
            onClick={() => {
              setSearchOpen(false);
              setSearchQuery(""); // reset search when closing
            }}
          >
            <CloseIcon w={4} h={4} color="gray.600" />
          </button>
        </Box>
      )}
    </Box>
  );
}

export default ChatSearch;
