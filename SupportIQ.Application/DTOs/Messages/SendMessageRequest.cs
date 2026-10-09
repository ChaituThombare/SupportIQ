using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Application.DTOs.Messages
{
    public class SendMessageRequest
    {
        [Required]
        [StringLength(5000, MinimumLength = 1)]
        public string MessageText { get; set; } = string.Empty;
    }
}
