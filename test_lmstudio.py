from openai import OpenAI

client = OpenAI(
    base_url="http://localhost:1234/v1",
    api_key="lm-studio"  # valor dummy
)

response = client.chat.completions.create(
    model="qwen2.5-coder",
    messages=[
        {
            "role": "system",
            "content": (
                "Você é um engenheiro de software sênior, especialista em debugging, "
                "arquitetura e refatoração. Sempre explique o problema, a causa raiz "
                "e proponha correções claras."
            )
        },
        {
            "role": "user",
            "content": "Explique como depurar erros de conexão em uma API Node.js."
        }
    ]
)

print(response.choices[0].message.content)
