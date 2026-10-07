using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SupportIQ.Domain.Entities
{
    public class KnowledgeChunk
    {
        public int ChunkId { get; set; }
        public int DocumentId { get; set; }
        public int ChunkIndex { get; set; }
        public string ChunkText { get; set; } = string.Empty;
        public byte[]? Embedding { get; set; }

        public KnowledgeDocument Document { get; set; } = null!;
    }
}
