using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Tickets
{
    public class TicketResponse
    {
        public int TicketId { get; set; }
        public int CustomerId { get; set; }
        public string Subject { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
        public string Priority { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public bool IsAIClassified { get; set; }
        public DateTime CreatedOn { get; set; }
    }
}
