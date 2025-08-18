import { Request, Response, NextFunction, RequestHandler } from "express";

// Use this to wrap ALL async controllers.
// Ensures the router sees a RequestHandler (returns void),
// and all rejections go to next(err).
export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<void>;

export const asyncHandler = (fn: AsyncHandler): RequestHandler => {
  return (req, res, next) => {
    // Avoiding "void Promise" lint errors by explicitly handling the promise.
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
