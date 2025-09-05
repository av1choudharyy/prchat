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
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

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
        title: "Please select a JPEG or PNG image",
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
        navigate("/chats");
      }
      setLoading(false);
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
    <Stack spacing="6">
      <FormControl isRequired id="name">
        <FormLabel color="black">Name</FormLabel>
        <Input
          type="text"
          name="name"
          value={credentials.name}
          placeholder="Enter Your Name"
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

      <FormControl isRequired id="email">
        <FormLabel color="black">Email</FormLabel>
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

      <FormControl isRequired id="password">
        <FormLabel color="black">Password</FormLabel>
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

      <FormControl isRequired id="confirmPassword">
        <FormLabel color="black">Confirm Password</FormLabel>
        <Input
          type="password"
          name="confirmPassword"
          value={credentials.confirmPassword}
          placeholder="Confirm Password"
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

      <FormControl id="pic">
  <FormLabel color="black">Upload your Picture</FormLabel>
  <Stack align="center">
    {/* Hidden file input */}
    <Input
      type="file"
      id="fileInput"
      display="none"
      accept="image/*"
      onChange={(e) => handleUploadPicture(e)}
    />

    {/* Custom styled button */}
    <Button
      as="label"
      htmlFor="fileInput"
      colorScheme="pink"
      cursor="pointer"
      textAlign="center"
    >
      Choose File
    </Button>
  </Stack>
</FormControl>


      <Button
        colorScheme="blue"
        width="100%"
        style={{ marginTop: 15 }}
        onClick={submitHandler}
        isLoading={loading}
      >
        Sign Up
      </Button>
    </Stack>
  );
};

export default Signup;
