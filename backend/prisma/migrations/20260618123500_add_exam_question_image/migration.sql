-- Add optional image URL for exam questions
ALTER TABLE "Question"
ADD COLUMN "imageUrl" TEXT;
