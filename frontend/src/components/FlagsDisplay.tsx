import { Alert, List, Text } from "@chakra-ui/react";

interface FlagsDisplayProps {
  flags: string[];
}

export default function FlagsDisplay({ flags }: FlagsDisplayProps) {
  if (flags.length === 0) return null;

  return (
    <Alert.Root status="warning">
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>Uncertain Phrases Detected</Alert.Title>
        <Alert.Description>
          <Text mb={1}>The following phrases may indicate uncertainty:</Text>
          <List.Root>
            {flags.map((flag, index) => (
              <List.Item key={index}>{flag}</List.Item>
            ))}
          </List.Root>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
