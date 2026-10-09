using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Messages
{
    public class MessageResponse
    {
        public int MessageId { get; set; }
        public int TicketId { get; set; }
        public int SenderId { get; set; }
        public string SenderType { get; set; } = string.Empty;
        public string MessageText { get; set; } = string.Empty;
        public bool IsAISuggested { get; set; }
        public DateTime CreatedOn { get; set; }
    }
}
