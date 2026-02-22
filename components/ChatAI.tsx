"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { ThinkingText } from "@/components/thinking-text"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Sparkles } from "lucide-react"

export default function ChatAI() {
  const { resolvedTheme } = useTheme()
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const stripMarkdown = (text: string): string => {
    return text.replace(/\*+/g, "") // removes *, **, ***
  }

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()
      const cleanText = stripMarkdown(data.text || "No response.")
      setResponse(cleanText)
    } catch (err) {
      console.error(err)
      setResponse("An error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="max-w-3xl mx-auto mt-10">
      <CardContent className="py-8">
        <h3 className="text-2xl font-bold text-center mb-4 flex justify-center items-center gap-2">
          <Sparkles className="text-purple-500" /> Ask Nirav's AI
        </h3>
        <div className="flex gap-2 mb-4">
          <Input
            type="text"
            placeholder="Ask something about Nirav..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-grow"
          />
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <ThinkingText isLight={resolvedTheme === "light"} /> : "Ask"}
          </Button>
        </div>
        {response && (
          <div className="p-4 rounded bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 whitespace-pre-line">
            {response}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
