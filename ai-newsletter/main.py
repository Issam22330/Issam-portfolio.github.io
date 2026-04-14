import os
import smtplib
import feedparser
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone
from jinja2 import Environment, FileSystemLoader
import re

# Aquí definimos de dónde sacaremos las noticias
FEEDS = [
    {"name": "The Verge (AI)", "url": "https://www.theverge.com/artificial-intelligence/rss/index.xml"},
    {"name": "Wired (AI)", "url": "https://www.wired.com/feed/tag/ai/latest/rss"},
    {"name": "MIT Tech Review", "url": "https://www.technologyreview.com/topic/artificial-intelligence/feed"},
    {"name": "TechCrunch (AI)", "url": "https://techcrunch.com/category/artificial-intelligence/feed/"}
]

def clean_html(raw_html):
    """Limpia el HTML del resumen para dejar solo texto legible."""
    if not raw_html: return ""
    cleanr = re.compile('<.*?>')
    cleantext = re.sub(cleanr, '', raw_html)
    text = ' '.join(cleantext.split())
    if len(text) > 250:
        return text[:247] + '...'
    return text

def extract_image(entry):
    """Intenta extraer la mejor imagen disponible de la noticia."""
    if 'media_content' in entry and len(entry.media_content) > 0:
        return entry.media_content[0]['url']
    if 'media_thumbnail' in entry and len(entry.media_thumbnail) > 0:
        return entry.media_thumbnail[0]['url']
    
    # Buscar en el contenido si hay una etiqueta <img>
    content = entry.content[0].value if 'content' in entry else entry.get('summary', '')
    img_match = re.search(r'<img[^>]+src=["\'](.*?)["\']', content)
    if img_match:
        return img_match.group(1)
    return None

def fetch_recent_news():
    """Descarga e filtra las noticias de las últimas 24 horas."""
    recent_news = []
    now = datetime.now(timezone.utc)
    one_day_ago = now - timedelta(hours=24)

    for feed_info in FEEDS:
        try:
            parsed_feed = feedparser.parse(feed_info["url"])
            for entry in parsed_feed.entries:
                # Extraemos la fecha de la noticia y comprobamos si no es muy antigua
                published_date = None
                if 'published_parsed' in entry and entry.published_parsed:
                    published_date = datetime(*entry.published_parsed[:6], tzinfo=timezone.utc)
                elif 'updated_parsed' in entry and entry.updated_parsed:
                     published_date = datetime(*entry.updated_parsed[:6], tzinfo=timezone.utc)
                
                if not published_date or published_date < one_day_ago:
                    continue  # Si es más vieja de 24h, la ignoramos

                image_url = extract_image(entry)
                summary_text = clean_html(entry.get('summary', entry.content[0].value if 'content' in entry else ''))

                recent_news.append({
                    "title": entry.title,
                    "link": entry.link,
                    "published": published_date.strftime("%d %b, %H:%M"),
                    "source": feed_info["name"],
                    "summary": summary_text,
                    "image": image_url
                })
        except Exception as e:
            print(f"Error procesando {feed_info['name']}: {e}")
            
    # Ordenamos por fecha
    recent_news.sort(key=lambda x: datetime.strptime(x['published'], "%d %b, %H:%M").replace(year=datetime.now().year), reverse=True)
    return recent_news

def send_email(html_content):
    """Envía el email usando la cuenta configurada en los Secrets de GitHub."""
    sender_email = os.environ.get("SENDER_EMAIL")
    sender_password = os.environ.get("SENDER_PASSWORD")
    receiver_email = "issammezdagat@gmail.com"

    if not sender_email or not sender_password:
        print("CRÍTICO: No se encontraron SENDER_EMAIL ni SENDER_PASSWORD en los secretos.")
        return

    msg = EmailMessage()
    msg['Subject'] = f"🤖 Resumen IA - {datetime.now().strftime('%d/%m/%Y')}"
    msg['From'] = f"AI News Bot <{sender_email}>"
    msg['To'] = receiver_email
    
    msg.set_content("Abre este correo en una app que soporte HTML para visualizarlo correctamente.")
    msg.add_alternative(html_content, subtype='html')

    try:
        # Recomendamos utilizar una contraseña de aplicación (App Password) de Gmail.
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as smtp:
            smtp.login(sender_email, sender_password)
            smtp.send_message(msg)
        print("✅ Correo enviado exitosamente a", receiver_email)
    except Exception as e:
        print(f"❌ Error al enviar el correo: {e}")

def main():
    print("Iniciando la búsqueda de noticias de IA...")
    news = fetch_recent_news()
    
    print(f"Encontradas {len(news)} noticias recientes del último día.")
    
    # Creamos el email con la plantilla
    print("Generando el boletín HTML...")
    env = Environment(loader=FileSystemLoader(os.path.dirname(os.path.abspath(__file__))))
    template = env.get_template('template.html')
    html_output = template.render(news=news)

    print("Procediendo a enviar el email...")
    send_email(html_output)

if __name__ == "__main__":
    main()
