import app from "../server";

export const config = {
  maxDuration: 60,
};

export default function handler(req: any, res: any) {
  return app(req, res);
}


