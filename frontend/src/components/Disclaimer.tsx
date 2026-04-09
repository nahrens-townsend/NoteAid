import { Box, Text } from "@chakra-ui/react";

export default function Disclaimer() {
  return (
    <Box
      position="sticky"
      bottom={0}
      width="100%"
      bg="yellow.100"
      borderTop="1px solid"
      borderColor="yellow.300"
      px={6}
      py={3}
      zIndex={10}
    >
      <Text fontSize="sm" color="yellow.800" textAlign="center">
        <strong>Not medical advice.</strong> Always review and verify
        AI-generated notes before clinical use. This tool is not HIPAA-compliant
        and is not intended for storing or transmitting protected health
        information (PHI). Do not enter identifiable patient data.
      </Text>
    </Box>
  );
}
