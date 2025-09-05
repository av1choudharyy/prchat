import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  useToast,
  Box,
  Image,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatState } from "../../context/ChatProvider"; // ✅ context
import chatLogo from "../../assets/chatlogo.png";

const Login = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const toast = useToast();
  const navigate = useNavigate();
  const { setUser } = ChatState(); // ✅ get setter

  const [credentials, setCredentials] = useState({
    email: "",
    password: "",
  });

  const handleCredentials = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const submitHandler = async () => {
    setLoading(true);

    if (!credentials.email || !credentials.password) {
      toast({
        title: "Please Fill all the Fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "left-accent",
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: credentials.email,
          password: credentials.password,
        }),
      });
      const data = await response.json();

      toast({
        title: data.message,
        status: !data.success ? "error" : "success",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: !data.success ? "left-accent" : "solid",
      });

      if (data.success) {
        localStorage.setItem("userInfo", JSON.stringify(data));
        setUser(data);
        setLoading(false);
        navigate("/chats");
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      toast({
        title: "Internal server error",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "solid",
      });
    }
  };

  return (
    <Stack spacing="6" align="center">
      {/* Logo */}
      <Box mb={4}>
        <Image
          src={chatLogo}
          alt="Chat Logo"
          boxSize="70px"
          objectFit="contain"
        />
      </Box>

      <Stack spacing="5" w="100%">
        <FormControl isRequired>
          <FormLabel htmlFor="email" color="black">
            Email
          </FormLabel>
          <Input
            type="email"
            name="email"
            value={credentials.email}
            placeholder="Enter Your Email"
            onChange={handleCredentials}
            variant="outline"
            borderWidth="1px"
            borderColor="gray.300"
            bg="white"
            color="black"
            _hover={{ borderColor: "gray.400" }}
            _focus={{
              borderColor: "blue.400",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
            }}
          />
        </FormControl>
      </Stack>

      <Stack spacing="5" w="100%">
        <FormControl isRequired>
          <FormLabel htmlFor="password" color="black">
            Password
          </FormLabel>
          <InputGroup>
            <InputRightElement w="4.5rem">
              <Button h="1.75rem" size="sm" onClick={() => setShow(!show)}>
                {show ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
            <Input
              type={show ? "text" : "password"}
              name="password"
              value={credentials.password}
              placeholder="Password"
              onChange={handleCredentials}
              variant="outline"
              borderWidth="1px"
              borderColor="gray.300"
              bg="white"
              color="black"
              _hover={{ borderColor: "gray.400" }}
              _focus={{
                borderColor: "blue.400",
                boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)",
              }}
            />
          </InputGroup>
        </FormControl>
      </Stack>

      <Button
        colorScheme="blue"
        width="100%"
        mt={4}
        onClick={submitHandler}
        isLoading={loading}
      >
        Login
      </Button>

      {/* Guest autofill */}
      <Button
        variant="solid"
        colorScheme="red"
        width="100%"
        onClick={() => {
          setCredentials({ email: "guest@example.com", password: "123456" });
        }}
        isDisabled={loading}
      >
        <i
          className="fas fa-user-alt"
          style={{ fontSize: "15px", marginRight: 8 }}
        />{" "}
        Get Guest User Credentials
      </Button>
    </Stack>
  );
};

export default Login;
