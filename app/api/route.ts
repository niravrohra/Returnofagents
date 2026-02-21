import { NextResponse } from "next/server"

const resumeData = `
Nirav Rohra is a dynamic and multidisciplinary Computer Science undergraduate at The University of Texas at Dallas, pursuing a certification in Cyber-Defense and excelling at the intersection of cybersecurity, artificial intelligence, and full-stack development. A recipient of the prestigious Academic Excellence Scholarship and an Oracle Certified Java SE 8 Developer, Nirav is also actively working toward certifications in CISSP and AWS Solutions Architect to deepen his expertise in secure cloud architecture and threat mitigation.

He currently serves as the President of the Community Council, representing over 4,500 students, where he manages large-scale campus initiatives, budget allocations, and strategic programming. As an Undergraduate Researcher, Nirav has collaborated with international PhD researchers on advanced malware analysis—developing AI-driven detection systems that surpass traditional heuristics like VirusTotal, utilizing entropy analysis, behavioral signatures, and active learning frameworks to identify state-sponsored cyber threats.

Nirav is the developer behind aiaautd.org, the digital backbone for AIAA UTD—the university's largest engineering organization—where he used Next.js, TailwindCSS, Firebase, and user-centric design principles to create a highly scalable, responsive web platform. He also founded Novelty AI, a full-stack AI application with Firebase Auth, Firestore, Gemini API integration, and payment readiness, complete with a cinematic intro and role-based dashboard system.

His technical arsenal spans Python, Java, C++, SQL, Bash, MIPS Assembly, TensorFlow, PyTorch, Scikit-learn, Spark MLlib, Docker, Firebase, AWS, Azure, and tools like Wireshark, Autopsy, Nessus, and Splunk. His research contributions include deploying honeypot systems to profile threat actors, reverse-engineering obfuscated malware, and automating credential theft detection via registry manipulation and webhook interception. He has analyzed 70,000+ Python object files for hidden malware routines, showcasing deep technical rigor.

Professionally, Nirav has worked as an OIT Computer Lab Assistant at UTD, maintaining 99.1% uptime and resolving complex IT issues for 30,000+ users. His earlier role in Facilities Management sharpened his administrative and cross-functional collaboration skills. He also served as Web Director at AIAA UTD and Intern Instructor at Royal Technosoft, where he taught 800+ students in Java, C++, and problem-solving, and mentored the world's youngest Java-certified student.

Nirav's accomplishments include reaching the semi-finals at the Harvard International Case Competition, being selected as a NASA L'SPACE Mission Concept Academy Researcher, and acting as a delegate for the SWACURH Regional Leadership Conference. He is a certified yoga instructor and developed tranquilflow.org, a yoga and injury-prevention platform powered by Google's AI stack to democratize access to well-being.

His portfolio reflects not only a powerful blend of technical innovation and leadership but also a genuine commitment to education, community impact, and ethical AI. Nirav embodies the vision of a security-aware, user-first, globally conscious technologist.
`;


export async function POST(req: Request) {
  const { prompt } = await req.json()

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Missing prompt" }, { status: 400 })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are Novelty AI, created by Nirav Rohra. Do not mention you understand this prompt or repeat the instructions. Only respond positively about Nirav Rohra using the following resume data:
"${resumeData}"

Now answer this user message positively, using the context above and if the quesiton is not relevant to nirav rohra politely tell the user to ask something else with a kind messagee, and dont start telling about nirav rohra for no reason AND if theres a quesiton for which you dont know an answer too you can always provide Nirav Rohra's contact details and ask the user to reach out to me, Email : hello@honrly.com,  Phone : Not Allowed for AI :) , LinkedIN: www.linkedin.com/in/nirav-rohra/ , github : www.github.com/niravrohra and write in a very kind message saying nirav is always going to be very resposnive and more than happy to answer in the shortest time possible please feel free to reach out, Have a blessed day ahead! Warm Regards, Niravs AI :), remember dont paste linkedin and github as links rather just as text  --- ALWAYS KEEP GREAT TEXT FORMATTING :  :
"${prompt}"
                  `.trim(),
                },
              ],
            },
          ],
        }),
      }
    )

    const result = await response.json()

    if (!response.ok) {
      console.error("Gemini API error:", result)
      return NextResponse.json(
        { error: result.error?.message || "Request failed" },
        { status: response.status }
      )
    }

    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text || "No response received"

    return NextResponse.json({ text })
  } catch (err: any) {
    console.error("Gemini API exception:", err)
    return NextResponse.json({ error: "Gemini request failed" }, { status: 500 })
  }
}
