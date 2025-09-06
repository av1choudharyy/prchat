import { useEffect, useState } from "react";
import { Text } from "@chakra-ui/react";

const Clock = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  const timeString = now.toLocaleTimeString();

  return (
    <Text fontSize="sm" opacity={0.8}>{timeString}</Text>
  );
};

export default Clock;


