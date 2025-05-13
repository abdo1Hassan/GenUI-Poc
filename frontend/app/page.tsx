"use client"
import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoaderCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [productTags, setProductTags] = useState([]);
  const [intent, setIntent] = useState("");
  const inputRef = useRef(null);

  const handleSend = async () => {
    if (!query.trim() && productTags.length === 0) return;
    const fullQuery = `${query} ${productTags.map(tag => tag).join(" ")}`.trim();
    const newMessage = { role: "user", content: fullQuery };
    setMessages([...messages, newMessage]);
    setQuery("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8182/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: fullQuery }),
      });
      const data = await res.json();
      setIntent(data.intent);

      if (data.intent === "compare") {
        const compareText = `Comparing ${productTags.join(" vs ")}`;
        setMessages((prev) => [...prev, { role: "assistant", content: compareText }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.result }]);
      }

      setProducts(data.products || []);
      setProductTags([]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (event) => {
    const title = event.dataTransfer.getData("product-title");
    if (title && !productTags.includes(title)) {
      setProductTags((prev) => [...prev, title]);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const removeTag = (tagToRemove) => {
    setProductTags((prev) => prev.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="flex flex-col justify-between max-w-lg mx-auto px-4 pt-6 pb-20 text-white font-sans min-h-screen bg-[#3D43DB]">
      <div className="text-center space-y-2 mb-6">
        <h1 className="text-2xl font-bold leading-tight">Is a camping trip on the cards?</h1>
        <p className="text-base font-medium">Our virtual assistant Dechatlon will help you prep.</p>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            className={`p-3 rounded-xl max-w-[80%] ${msg.role === "user" ? "bg-white text-black ml-auto" : "bg-[#5C62FF] text-white mr-auto"}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {msg.content}
          </motion.div>
        ))}
        {loading && <LoaderCircle className="animate-spin text-white mx-auto" />}
      </div>

      {products.length > 0 && intent !== "compare" && (
        <div className="overflow-x-auto whitespace-nowrap space-x-4 flex py-4 mt-4">
          {products.map((p, idx) => (
            <Card
              key={idx}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("product-title", p.title)}
              className="inline-block w-52 cursor-grab shadow-lg bg-white text-black"
            >
              <CardContent className="p-3 space-y-2">
                <img src={p.image} alt={p.title} className="w-full h-36 object-cover rounded-md" />
                <div className="font-semibold text-sm truncate">{p.title}</div>
                <div className="text-xs text-gray-700">{p.brand} – {p.price}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div onDrop={handleDrop} onDragOver={handleDragOver} className="sticky bottom-0 bg-[#3D43DB] pt-4">
        <div className="border border-white p-3 rounded-xl space-y-3 bg-[#4E54E1]">
          <div className="flex flex-wrap gap-2">
            {productTags.map((tag, idx) => (
              <div key={idx} className="bg-white text-black text-sm px-3 py-1 rounded-full flex items-center gap-1">
                {tag}
                <button onClick={() => removeTag(tag)} className="text-xs">✕</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type your query or drag products here"
              className="flex-1 text-black"
            />
            <Button onClick={handleSend} className="bg-white text-[#3D43DB] hover:bg-gray-100">Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
