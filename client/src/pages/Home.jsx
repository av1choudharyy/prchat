import {
  Container,
  Box,
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useColorModeValue,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Login, Signup } from "../components";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  // Light/dark mode values
  const bg = useColorModeValue("gray.100", "gray.900"); // page background
  const boxBg = useColorModeValue("white", "gray.700"); // card background
  const textColor = useColorModeValue("black", "white");

  return (
    <Container maxWidth="xl" minH="100vh" bg={bg} centerContent>
      {/* App Title */}
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        p={3}
        bg={boxBg}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
      >
        <Text
          fontSize="4xl"
          fontFamily="Work sans"
          textAlign="center"
          color={textColor}
        >
          PRChat
        </Text>
      </Box>

      {/* Login / Signup Tabs */}
      <Box bg={boxBg} w="100%" p={4} borderRadius="lg" borderWidth="1px">
        <Tabs isFitted variant="soft-rounded" colorScheme="blue">
          <TabList mb="1em">
            <Tab>Login</Tab>
            <Tab>Sign Up</Tab>
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
