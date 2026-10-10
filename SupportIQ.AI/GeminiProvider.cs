using Microsoft.Extensions.Configuration;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using SupportIQ.Application.Interfaces;
using System.Collections.Generic;

namespace SupportIQ.AI
{
    public class GeminiProvider : IAIProvider
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public GeminiProvider(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<AIAnalysisResult> AnalyzeTicketAsync(string subject, string description, CancellationToken cancellationToken = default)
        {
            var apiKey = _configuration["AI:ApiKey"];

            if (string.IsNullOrWhiteSpace(apiKey))
            {
                throw new InvalidOperationException("API key is not configured.");
            }

            var model = _configuration["AI:Model"] ?? "gemini-3.8-flash";

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent";

            using var request = new HttpRequestMessage(
                HttpMethod.Post, url);

            request.Headers.Add("x-goog-api-key", apiKey);

            request.Content = JsonContent.Create(new
            {
                systemInstruction = new {
                    parts = new[]
                    {
                        new
                        {
                            text = """
                            You classify customer support tickets.
                            return only a valid JSON object with:
                            Category, priority, suggestedResponse.

                            Allowed categories:
                            Payment, Order, Delivery, Product, Refund, Account, Technical, Other.

                            Allowed priorities:
                            Low, Medium, High, Critical.

                            Choose priority based on urgency and impact.
                            Do not claim that a payment, refund, or order action has been performed.
                            SuggestResponse must be a polite draft for a human support agent to review.
                            """
                        }
                    }
                },
                contents = new[]
                {
                    new
                    {
                        role = "user",
                        parts = new[]
                        {
                            new
                            {
                                text = $"Subject: {subject}\nDescription: {description}"
                            }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    temperature = 0.2
                }
            });

            using var response = await _httpClient.SendAsync(request, cancellationToken);

            response.EnsureSuccessStatusCode();

            using var responseStream = await response.Content.ReadAsStreamAsync(cancellationToken);

            using var document = await JsonDocument.ParseAsync(responseStream, cancellationToken: cancellationToken);

            var root = document.RootElement;

            if(!root.TryGetProperty("candidates", out var candidates) || candidates.ValueKind != JsonValueKind.Array || candidates.GetArrayLength() == 0)
            {
                var blockReason = "unknown";

                if (root.TryGetProperty("promptFeedback", out var feedback) &&
                    feedback.TryGetProperty("blockReason", out var block))
                {
                    blockReason = block.GetString() ?? "unknown";
                }
                throw new InvalidOperationException($"AI provider returned no candidates. Block reason {blockReason}");
            }

            var candidate = candidates[0];

            var finishReason = candidate.TryGetProperty("finishReason", out var finish) ? finish.GetString() ?? "unknown" : "unknown";

            if (!candidate.TryGetProperty("content", out var content) || 
               !content.TryGetProperty("parts", out var parts) ||
               parts.ValueKind != JsonValueKind.Array)
            {
                throw new InvalidOperationException($"Gemini returned no text content. Finish reason: {finishReason}.");
            }

            var textParts = new List<string>();

            foreach(var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var textElement))
                {
                    var partText = textElement.GetString();

                    if(!string.IsNullOrWhiteSpace(partText))
                    {
                        textParts.Add(partText);
                    }
                }
            }

            var json = string.Join("\n", textParts).Trim();

            if(string.IsNullOrWhiteSpace(json))
            {
                throw new InvalidOperationException($"Gemini returned empty text. Finish reason: {finishReason}.");
            }

            AIAnalysisResult? result;
            try
            {
                result = JsonSerializer.Deserialize<AIAnalysisResult>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch (JsonException)
            {
                throw new InvalidOperationException("Gemini returned text that could not be parsed as JSON.");
            }

            if (result == null || 
                string.IsNullOrWhiteSpace(result.Category) ||
                string.IsNullOrWhiteSpace(result.Priority) ||
                string.IsNullOrWhiteSpace(result.SuggestedResponse))
            {
                throw new InvalidOperationException("Gemini JSON is missing category, priority, or suggestedResponse.");
            }

            return result;
        }
    }
}
