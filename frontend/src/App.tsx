import { useState } from "react";
import { Alert, Box, Button, Grid, GridItem, Heading } from "@chakra-ui/react";
import NoteInput from "./components/NoteInput";
import SOAPForm from "./components/SOAPForm";
import ConfidenceBadge from "./components/ConfidenceBadge";
import FlagsDisplay from "./components/FlagsDisplay";
import Disclaimer from "./components/Disclaimer";
import { generateNote } from "./api/noteService";
import type { NoteResponse } from "./api/noteService";

function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRawInput, setLastRawInput] = useState("");
  const [soapData, setSoapData] = useState<NoteResponse | null>(null);
  const [soapFields, setSoapFields] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
  });

  const handleGenerate = async (rawInput: string) => {
    setLastRawInput(rawInput);
    setIsLoading(true);
    setError(null);
    try {
      const result = await generateNote(rawInput);
      setSoapData(result);
      setSoapFields({
        subjective: result.subjective,
        objective: result.objective,
        assessment: result.assessment,
        plan: result.plan,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (lastRawInput) handleGenerate(lastRawInput);
  };

  const handleFieldChange = (
    field: "subjective" | "objective" | "assessment" | "plan",
    value: string,
  ) => {
    setSoapFields((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box>
      <Box minH="100vh" bg="gray.50" p={6} pb={20}>
        <Heading as="h1" size="xl" mb={6} textAlign="center" color="teal.700">
          NoteAid
        </Heading>
        <Grid
          templateColumns={{ base: "1fr", md: "1fr 1fr" }}
          gap={6}
          alignItems="start"
        >
          <GridItem>
            <Box bg="white" borderRadius="md" boxShadow="sm" p={6}>
              <NoteInput onGenerate={handleGenerate} isLoading={isLoading} />
            </Box>
          </GridItem>
          <GridItem>
            <Box bg="white" borderRadius="md" boxShadow="sm" p={6}>
              <Heading as="h2" size="md" mb={4} color="gray.700">
                SOAP Note
              </Heading>
              {error && (
                <Alert.Root status="error" mb={4}>
                  <Alert.Indicator />
                  <Alert.Content>
                    <Alert.Description>{error}</Alert.Description>
                  </Alert.Content>
                </Alert.Root>
              )}
              {soapData && (
                <Box mb={4}>
                  <ConfidenceBadge confidence={soapData.confidence} />
                </Box>
              )}
              {soapData && soapData.flags.length > 0 && (
                <Box mb={4}>
                  <FlagsDisplay flags={soapData.flags} />
                </Box>
              )}
              <SOAPForm
                subjective={soapFields.subjective}
                objective={soapFields.objective}
                assessment={soapFields.assessment}
                plan={soapFields.plan}
                onChange={handleFieldChange}
              />
              {soapData && (
                <Button
                  mt={4}
                  colorPalette="teal"
                  variant="outline"
                  onClick={handleRegenerate}
                  loading={isLoading}
                  loadingText="Regenerating..."
                  disabled={isLoading}
                >
                  Regenerate
                </Button>
              )}
            </Box>
          </GridItem>
        </Grid>
      </Box>
      <Disclaimer />
    </Box>
  );
}

export default App;
