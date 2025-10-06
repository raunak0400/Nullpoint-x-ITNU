'use server';
/**
 * @fileOverview A flow that provides actionable recommendations based on the forecast and its influencing factors.
 *
 * - getActionRecommendations - A function that retrieves actionable recommendations.
 * - GetActionRecommendationsInput - The input type for the getActionRecommendations function.
 * - GetActionRecommendationsOutput - The return type for the getActionRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GetActionRecommendationsInputSchema = z.object({
  forecastSummary: z
    .string()
    .describe('A summary of the current pollution forecast.'),
  influencingFactors: z
    .string()
    .describe('A description of the factors influencing the forecast.'),
});
export type GetActionRecommendationsInput = z.infer<
  typeof GetActionRecommendationsInputSchema
>;

const GetActionRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Actionable recommendations based on the forecast.'),
});
export type GetActionRecommendationsOutput = z.infer<
  typeof GetActionRecommendationsOutputSchema
>;

export async function getActionRecommendations(
  input: GetActionRecommendationsInput
): Promise<GetActionRecommendationsOutput> {
  return getActionRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getActionRecommendationsPrompt',
  input: {schema: GetActionRecommendationsInputSchema},
  output: {schema: GetActionRecommendationsOutputSchema},
  prompt: `You are an expert in air quality and public health. Based on the pollution forecast summary and the influencing factors, provide actionable recommendations for the user to mitigate potential pollution exposure or support positive change.\n\nForecast Summary: {{{forecastSummary}}}\n\nInfluencing Factors: {{{influencingFactors}}}\n\nRecommendations:`,
});

const getActionRecommendationsFlow = ai.defineFlow(
  {
    name: 'getActionRecommendationsFlow',
    inputSchema: GetActionRecommendationsInputSchema,
    outputSchema: GetActionRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
