const Controller = require("./controller");
const { StatusCodes: HttpStatus } = require("http-status-codes");
const mongoose = require("mongoose");
const createHttpError = require("http-errors");
const { ProposalModel } = require("../../models/proposal");
const { addProposalSchema } = require("../validators/proposal.schema");
const { ProjectModel } = require("../../models/project");
const { copyObject } = require("../../../utils/functions");
const { ROLES } = require("../../../utils/constants");

class ProposalController extends Controller {
  async addNewProposal(req, res) {
    const userId = req.user._id;
    await addProposalSchema.validateAsync(req.body);
    const { description, price, duration, projectId } = req.body;

    const proposal = await ProposalModel.create({
      description,
      price,
      duration,
      user: userId,
    });
    await ProjectModel.updateOne(
      { _id: projectId },
      { $push: { proposals: proposal._id } }
    );
    if (!proposal?._id)
      throw createHttpError.InternalServerError("Offer not registered");

    return res.status(HttpStatus.CREATED).json({
      statusCode: HttpStatus.CREATED,
      data: {
        message: "Offer created successfully",
      },
    });
  }

  async getListOfProposals(req, res) {
    let dbQuery = {};
    const { sort, status } = req.query;

    const user = req.user;
    if (user.role !== ROLES.ADMIN) {
      dbQuery["user"] = user._id;
    }

    if ([0, 1, 2].includes(parseInt(status))) {
      dbQuery["status"] = { $in: [parseInt(status)] };
    } else if (status === "ALL") {
      // If status is ALL, don't add any condition for status
    }

    const sortQuery = {};

    if (!sort) sortQuery["createdAt"] = 1;
    if (sort) {
      if (sort === "latest") sortQuery["createdAt"] = -1;
      if (sort === "earliest") sortQuery["createdAt"] = 1;
    }

    const proposals = await ProposalModel.find(dbQuery).sort(sortQuery);

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        proposals,
      },
    });
  }

  async getProposalById(req, res) {
    const { id } = req.params;
    const proposal = await this.findProposalById(id);
    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        proposal,
      },
    });
  }
  async findProposalById(id) {
    if (!mongoose.isValidObjectId(id))
      throw createHttpError.BadRequest(
        "The submitted project ID is not correct"
      );
    const proposal = await ProposalModel.findById(id);
    if (!proposal) throw createHttpError.NotFound("Project not found.");
    return proposal;
  }

  async changeProposalStatus(req, res) {
    const { id } = req.params;
    let { status, projectId } = req.body;
    status = Number(status);
    const proposal = await ProposalModel.findOneAndUpdate(
      { _id: id },
      { $set: { status } } // 0, 1, 2
    );

    let freelancer = copyObject(proposal).user;
    if (status !== 2) freelancer = null;

    await ProjectModel.updateOne({ _id: projectId }, { $set: { freelancer } });

    if (!proposal)
      throw createHttpError.InternalServerError(
        "Proposal status was not updated"
      );

    let message = "Proposal Status Confirmed";
    if (status === 0) message = "Proposal status changed to Rejected";
    if (status === 1)
      message =
        "The status of the proposal has been changed to pending approval";

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      data: {
        message,
      },
    });
  }
}

module.exports = {
  ProposalController: new ProposalController(),
};
