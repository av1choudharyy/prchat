import {
  Container,
  Box,
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  HStack,
  Switch,
  useColorMode,
  useColorModeValue,
  FormLabel,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Login, Signup } from "../components";

const Home = () => {
  const navigate = useNavigate();
  const { colorMode, toggleColorMode } = useColorMode();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));
    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Container maxWidth="xl">
      {/* Header Box */}
      <HStack style={{ position: "absolute", top: 10, right: 10 }}>
        <FormLabel
          htmlFor="dark-mode"
          mb="0"
          fontSize="sm"
          color={colorMode === "dark" ? "yellow.300" : "white"}
        >
          {colorMode === "dark" ? "Dark" : "Light"}
        </FormLabel>
        <Switch
          colorScheme="yellow"
          isChecked={colorMode === "dark"}
          onChange={toggleColorMode}
        />
      </HStack>
      <Box
        d="flex"
        justifyContent="center"
        p={3}
        bg={useColorModeValue("white", "gray.800")}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="md"
      >
        <Text
          fontSize="4xl"
          fontFamily="Work sans"
          textAlign="center"
          color={useColorModeValue("gray.800", "white")}
        >
          PRChat
        </Text>
      </Box>

      {/* Tabs Box */}
      <Box
        bg={useColorModeValue("white", "gray.700")}
        w="100%"
        p={4}
        borderRadius="lg"
        borderWidth="1px"
        boxShadow="md"
      >
        <Tabs isFitted variant="soft-rounded" colorScheme="blue">
          <TabList mb="1em">
            <Tab color={useColorModeValue("black", "white")}>Login</Tab>
            <Tab color={useColorModeValue("black", "white")}>Sign Up</Tab>
          </TabList>
          <TabPanels>
            <TabPanel>
              <Login />
            </TabPanel>
            <TabPanel>
              <Signup />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default Home;
