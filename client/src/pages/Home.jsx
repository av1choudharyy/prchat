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
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  useEffect(() => {
    const userInfo = JSON.parse(localStorage.getItem("userInfo"));

    if (!userInfo) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <Container maxWidth="xl">
      <Box
        d="flex"
        justifyContent="center"
        p={3}
        bg={bgColor}
        w="100%"
        m="40px 0 15px 0"
        borderRadius="lg"
        borderWidth="1px"
        borderColor={borderColor}
      >
        <Text fontSize="4xl" fontFamily="Work sans" textAlign="center">
          PRChat
        </Text>
      </Box>

      <Box bg={bgColor} w="100%" p={4} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Tabs isFitted variant="soft-rounded">
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
