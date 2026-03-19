import net from 'node:net';
import tls from 'node:tls';

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

function b64(s: string): string {
  return Buffer.from(s, 'utf8').toString('base64');
}

function normalizeLines(s: string): string {
  return s.replace(/\r?\n/g, '\r\n');
}

function buildMessage(input: { from: string; to: string; subject: string; text: string }): string {
  const headers = [
    `From: ${input.from}`,
    `To: ${input.to}`,
    `Subject: ${input.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset="utf-8"`,
    `Content-Transfer-Encoding: 7bit`,
  ];
  return normalizeLines(headers.join('\n') + '\n\n' + input.text) + '\r\n';
}

type Reply = { code: number; lines: string[] };

export async function sendSmtpMail(
  cfg: SmtpConfig,
  input: { to: string; subject: string; text: string }
): Promise<void> {
  if (!cfg.host || !cfg.user || !cfg.pass) {
    throw new Error('SMTP is not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)');
  }
  const from = cfg.from || cfg.user;
  if (!from) throw new Error('SMTP_FROM (or SMTP_USER) must be set');

  const socket: net.Socket | tls.TLSSocket = cfg.secure
    ? tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host })
    : net.connect({ host: cfg.host, port: cfg.port });

  socket.setTimeout(30_000);

  const readReply = () =>
    new Promise<Reply>((resolve, reject) => {
      let buf = '';
      const onData = (chunk: Buffer) => {
        buf += chunk.toString('utf8');
        const parts = buf.split(/\r\n/);
        buf = parts.pop() ?? '';
        const lines = parts.filter(Boolean);
        if (!lines.length) return;

        // SMTP multiline: "250-" continues; "250 " final.
        const last = lines[lines.length - 1];
        const m = last.match(/^(\d{3})([\s-])(.*)$/);
        if (!m) return;
        const code = Number(m[1]);
        const cont = m[2] === '-';
        if (cont) return;

        socket.off('data', onData);
        resolve({ code, lines });
      };

      const onErr = (e: any) => {
        socket.off('data', onData);
        reject(e);
      };

      const onTimeout = () => onErr(new Error('SMTP timeout'));
      socket.once('error', onErr);
      socket.once('timeout', onTimeout);
      socket.on('data', onData);
    });

  const writeLine = (line: string) =>
    new Promise<void>((resolve, reject) => {
      socket.write(line + '\r\n', (err) => (err ? reject(err) : resolve()));
    });

  const expect = async (expectedPrefix: number | number[]) => {
    const reply = await readReply();
    const expected = Array.isArray(expectedPrefix) ? expectedPrefix : [expectedPrefix];
    if (!expected.includes(reply.code)) {
      throw new Error(`SMTP error ${reply.code}: ${reply.lines.join(' | ')}`);
    }
    return reply;
  };

  await expect(220);
  await writeLine(`EHLO localhost`);
  await expect(250);

  await writeLine('AUTH LOGIN');
  await expect(334);
  await writeLine(b64(cfg.user));
  await expect(334);
  await writeLine(b64(cfg.pass));
  await expect(235);

  await writeLine(`MAIL FROM:<${from}>`);
  await expect(250);
  await writeLine(`RCPT TO:<${input.to}>`);
  await expect([250, 251]);
  await writeLine('DATA');
  await expect(354);

  const msg = buildMessage({ from, to: input.to, subject: input.subject, text: input.text });
  await new Promise<void>((resolve, reject) => socket.write(msg + '\r\n.\r\n', (err) => (err ? reject(err) : resolve())));
  await expect(250);

  await writeLine('QUIT');
  await expect(221);

  socket.end();
}

