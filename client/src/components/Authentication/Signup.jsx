import {
  Button,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Stack,
  useToast,
  Box,
  HStack,
  Switch,
  Text,
  useColorMode,
  useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const { colorMode, toggleColorMode } = useColorMode();

  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    pic: "",
  });

  const handleCredentials = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleUploadPicture = async (e) => {
    setLoading(true);

    if (e.target.files[0] === undefined) {
      setLoading(false);
      return toast({
        title: "Please select an image",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "left-accent",
      });
    }

    if (
      e.target.files[0].type === "image/jpeg" ||
      e.target.files[0].type === "image/png"
    ) {
      try {
        const data = new FormData();
        data.append("file", e.target.files[0]);
        data.append("upload_preset", "chat-app");
        data.append("cloud_name", "devcvus7v");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/devcvus7v/image/upload",
          {
            method: "POST",
            body: data,
          }
        );
        const json = await response.json();

        setCredentials({
          ...credentials,
          [e.target.name]: json.secure_url.toString(),
        });
        setLoading(false);
      } catch (error) {
        console.log(error);
        setLoading(false);
      }
    } else {
      setLoading(false);
      return toast({
        title: "Please select an image (jpeg/png only)",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "left-accent",
      });
    }
  };

  const submitHandler = async () => {
    setLoading(true);

    if (
      !credentials.name ||
      !credentials.email ||
      !credentials.password ||
      !credentials.confirmPassword
    ) {
      setLoading(false);
      return toast({
        title: "Please Fill all the Fields",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "left-accent",
      });
    }

    if (credentials.password !== credentials.confirmPassword) {
      setLoading(false);
      return toast({
        title: "Passwords Do Not Match",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
        variant: "left-accent",
      });
    }

    try {
      const response = await fetch("/api/user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: credentials.name,
          email: credentials.email,
          password: credentials.password,
          pic: credentials.pic,
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
        setLoading(false);
        navigate("/chats");
      } else {
        setLoading(false);
      }
    } catch (error) {
      setLoading(false);
      return toast({
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
    <Box
      bg={useColorModeValue("white", "gray.800")}
      p={8}
      borderRadius="lg"
      boxShadow="lg"
    >
      <Stack spacing="6">
        <FormControl isRequired id="name">
          <FormLabel>Name</FormLabel>
          <Input
            type="text"
            name="name"
            value={credentials.name}
            placeholder="Enter Your Name"
            onChange={handleCredentials}
            bg={useColorModeValue("gray.100", "gray.700")}
          />
        </FormControl>

        <FormControl isRequired id="email">
          <FormLabel>Email</FormLabel>
          <Input
            type="email"
            name="email"
            value={credentials.email}
            placeholder="Enter Your Email"
            onChange={handleCredentials}
            bg={useColorModeValue("gray.100", "gray.700")}
          />
        </FormControl>

        <FormControl isRequired id="password">
          <FormLabel>Password</FormLabel>
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
              bg={useColorModeValue("gray.100", "gray.700")}
            />
          </InputGroup>
        </FormControl>

        <FormControl isRequired id="confirmPassword">
          <FormLabel>Confirm Password</FormLabel>
          <InputGroup>
            <InputRightElement w="4.5rem">
              <Button h="1.75rem" size="sm" onClick={() => setShow(!show)}>
                {show ? "Hide" : "Show"}
              </Button>
            </InputRightElement>
            <Input
              type={show ? "text" : "password"}
              name="confirmPassword"
              value={credentials.confirmPassword}
              placeholder="Confirm Password"
              onChange={handleCredentials}
              bg={useColorModeValue("gray.100", "gray.700")}
            />
          </InputGroup>
        </FormControl>

        <FormControl id="pic">
          <FormLabel>Upload your Picture</FormLabel>
          <InputGroup>
            <InputLeftElement pointerEvents="none">
              <i className="fas fa-folder-open" />
            </InputLeftElement>
            <Input
              type="file"
              name="pic"
              accept="image/*"
              sx={{
                "::file-selector-button": {
                  height: 10,
                  padding: 0,
                  mr: 4,
                  background: "none",
                  border: "none",
                  fontWeight: "bold",
                },
              }}
              onChange={handleUploadPicture}
              bg={useColorModeValue("gray.100", "gray.700")}
            />
          </InputGroup>
        </FormControl>

        <Button
          colorScheme="blue"
          width="100%"
          mt={4}
          onClick={submitHandler}
          isLoading={loading}
        >
          Sign Up
        </Button>
      </Stack>
    </Box>
  );
};

export default Signup;
