using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.AI
{
    public class AITicketAnalysisResponse
    {
        public int TicketId { get; set; }
        public string Category { get; set; } = "Other";
        public string Priority { get; set; } = "Low";
        public string SuggestedResponse { get; set; } = string.Empty;
        public bool IsAIClassified { get; set; }
    }
}
