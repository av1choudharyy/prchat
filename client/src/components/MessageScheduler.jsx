import { useState, useEffect } from "react";
import {
    Box,
    Button,
    FormControl,
    FormLabel,
    IconButton,
    Input,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Select,
    Switch,
    Text,
    Textarea,
    useToast,
    VStack,
    HStack,
} from "@chakra-ui/react";

const MessageScheduler = ({ isOpen, onClose, onSchedule, currentMessage }) => {
    const [scheduledMessage, setScheduledMessage] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [scheduledHour, setScheduledHour] = useState("");
    const [scheduledMinute, setScheduledMinute] = useState("");
    const [scheduledPeriod, setScheduledPeriod] = useState("AM");
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurringPattern, setRecurringPattern] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();

    // Update message when modal opens with current message
    useEffect(() => {
        if (isOpen && currentMessage) {
            setScheduledMessage(currentMessage);
        }

        // Auto-populate date and time when modal opens
        if (isOpen) {
            const now = new Date();
            const oneMinuteLater = new Date(now.getTime() + 60000); // Add 1 minute

            // Format date as YYYY-MM-DD
            const year = oneMinuteLater.getFullYear();
            const month = String(oneMinuteLater.getMonth() + 1).padStart(2, '0');
            const day = String(oneMinuteLater.getDate()).padStart(2, '0');
            const formattedDate = `${year}-${month}-${day}`;

            // Format time for iOS-style picker
            let hours = oneMinuteLater.getHours();
            const minutes = oneMinuteLater.getMinutes();
            const period = hours >= 12 ? "PM" : "AM";

            // Convert to 12-hour format
            if (hours === 0) hours = 12;
            else if (hours > 12) hours = hours - 12;

            setScheduledDate(formattedDate);
            setScheduledHour(String(hours).padStart(2, '0'));
            setScheduledMinute(String(minutes).padStart(2, '0'));
            setScheduledPeriod(period);
        }
    }, [isOpen, currentMessage]);

    const handleSchedule = async () => {
        if (!scheduledMessage.trim()) {
            toast({
                title: "Message Required",
                description: "Please enter a message to schedule",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (!scheduledDate || !scheduledHour || !scheduledMinute) {
            toast({
                title: "Date and Time Required",
                description: "Please select date, hour, and minute",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        // Convert 12-hour format to 24-hour format
        let hour24 = parseInt(scheduledHour);
        if (scheduledPeriod === "AM" && hour24 === 12) {
            hour24 = 0;
        } else if (scheduledPeriod === "PM" && hour24 !== 12) {
            hour24 += 12;
        }

        // Create time string in 24-hour format
        const timeString = `${String(hour24).padStart(2, '0')}:${scheduledMinute}`;
        const scheduledDateTime = new Date(`${scheduledDate}T${timeString}`);

        if (scheduledDateTime <= new Date()) {
            toast({
                title: "Invalid Time",
                description: "Scheduled time must be in the future",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        if (isRecurring && !recurringPattern) {
            toast({
                title: "Recurring Pattern Required",
                description: "Please select a recurring pattern",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
            return;
        }

        setIsLoading(true);

        const scheduleData = {
            content: scheduledMessage,
            scheduledTime: scheduledDateTime.toISOString(),
            isRecurring,
            recurringPattern: isRecurring ? recurringPattern : null,
        };

        try {
            await onSchedule(scheduleData);

            toast({
                title: "Message Scheduled",
                description: `Message scheduled for ${scheduledDateTime.toLocaleString()}`,
                status: "success",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });

            // Reset form
            setScheduledMessage("");
            setScheduledDate("");
            setScheduledHour("");
            setScheduledMinute("");
            setScheduledPeriod("AM");
            setIsRecurring(false);
            setRecurringPattern("");
            onClose();
        } catch (error) {
            toast({
                title: "Scheduling Failed",
                description: "Failed to schedule message",
                status: "error",
                duration: 3000,
                isClosable: true,
                position: "bottom-right",
            });
        }

        setIsLoading(false);
    };

    const getMinDateTime = () => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Generate hour options (1-12)
    const hourOptions = Array.from({ length: 12 }, (_, i) => {
        const hour = i + 1;
        return (
            <option key={hour} value={String(hour).padStart(2, '0')}>
                {String(hour).padStart(2, '0')}
            </option>
        );
    });

    // Generate minute options (00-59)
    const minuteOptions = Array.from({ length: 60 }, (_, i) => (
        <option key={i} value={String(i).padStart(2, '0')}>
            {String(i).padStart(2, '0')}
        </option>
    ));

    return (
        <Modal isOpen={isOpen} onClose={onClose} size="md">
            <ModalOverlay />
            <ModalContent>
                <ModalHeader>Schedule Message</ModalHeader>
                <ModalCloseButton />
                <ModalBody>
                    <VStack spacing={4}>
                        <FormControl>
                            <FormLabel>Message</FormLabel>
                            <Textarea
                                placeholder="Enter your message..."
                                value={scheduledMessage}
                                onChange={(e) => setScheduledMessage(e.target.value)}
                                rows={3}
                                bg="gray.50"
                                isReadOnly={!!currentMessage}
                                _readOnly={{
                                    bg: "gray.100",
                                    cursor: "not-allowed",
                                    color: "gray.700"
                                }}
                            />
                            {currentMessage && (
                                <Text fontSize="xs" color="gray.500" mt={1}>
                                    Message pre-filled from chat input
                                </Text>
                            )}
                        </FormControl>

                        <FormControl>
                            <FormLabel>Date</FormLabel>
                            <Input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                min={getMinDateTime()}
                            />
                        </FormControl>

                        <FormControl>
                            <FormLabel>Time</FormLabel>
                            <HStack spacing={2} align="center">
                                <Select
                                    placeholder="Hour"
                                    value={scheduledHour}
                                    onChange={(e) => setScheduledHour(e.target.value)}
                                    bg="white"
                                    borderRadius="lg"
                                    fontSize="lg"
                                    textAlign="center"
                                    flex="1"
                                >
                                    {hourOptions}
                                </Select>

                                <Text fontSize="xl" fontWeight="bold" px={2}>:</Text>

                                <Select
                                    placeholder="Min"
                                    value={scheduledMinute}
                                    onChange={(e) => setScheduledMinute(e.target.value)}
                                    bg="white"
                                    borderRadius="lg"
                                    fontSize="lg"
                                    textAlign="center"
                                    flex="1"
                                >
                                    {minuteOptions}
                                </Select>

                                <Select
                                    value={scheduledPeriod}
                                    onChange={(e) => setScheduledPeriod(e.target.value)}
                                    bg="white"
                                    borderRadius="lg"
                                    fontSize="lg"
                                    textAlign="center"
                                    minWidth="90px"
                                    flex="0 0 90px"
                                >
                                    <option value="AM">AM</option>
                                    <option value="PM">PM</option>
                                </Select>
                            </HStack>
                        </FormControl>

                        <FormControl display="flex" alignItems="center">
                            <FormLabel mb="0">Recurring Message</FormLabel>
                            <Switch
                                isChecked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                            />
                        </FormControl>

                        {isRecurring && (
                            <FormControl>
                                <FormLabel>Repeat Pattern</FormLabel>
                                <Select
                                    placeholder="Select pattern"
                                    value={recurringPattern}
                                    onChange={(e) => setRecurringPattern(e.target.value)}
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </Select>
                            </FormControl>
                        )}

                        {scheduledDate && scheduledHour && scheduledMinute && (
                            <Box p={3} bg="blue.50" borderRadius="md" w="100%">
                                <Text fontSize="sm" color="blue.600">
                                    <strong>Scheduled for:</strong>{" "}
                                    {scheduledDate} at {scheduledHour}:{scheduledMinute} {scheduledPeriod}
                                </Text>
                                {isRecurring && recurringPattern && (
                                    <Text fontSize="sm" color="blue.600">
                                        <strong>Repeats:</strong> {recurringPattern}
                                    </Text>
                                )}
                            </Box>
                        )}
                    </VStack>
                </ModalBody>

                <ModalFooter>
                    <Button variant="ghost" mr={3} onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        colorScheme="blue"
                        onClick={handleSchedule}
                        isLoading={isLoading}
                        loadingText="Scheduling..."
                    >
                        Schedule Message
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};

export default MessageScheduler;
