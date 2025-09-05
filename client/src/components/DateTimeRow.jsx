import { Box, Grid, Text } from "@chakra-ui/react";

function formatTime12h(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateNoYear(timestamp) {
  const d = new Date(timestamp);
  return d.toLocaleString([], { month: "short", day: "2-digit" }); // e.g., "Sep 04"
}

export const DateTimeRow = ({ timestamp }) => (
    <Grid templateColumns="1fr 1fr" alignItems="center">
      <Text fontSize="8px" color="gray.500">
        {formatDateNoYear(timestamp)}
      </Text>
      <Text fontSize="8px" color="gray.500">
        {formatTime12h(timestamp)}
      </Text>
    </Grid>
);

export default DateTimeRow;
