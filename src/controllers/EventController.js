// controllers/EventController.js
import Event from '../models/Event.js';
import { HttpResponse } from '../utils/HttpResponse.js';
import cloudinary from '../config/cloudinary.js';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Create Event
export const CreateEvent = async (req, res) => {
  const userId = req.userId;
  const {
    title,
    description,
    eventType,
    startDate,
    endDate,
    location,
    organizer,
    image,
    capacity,
    tags,
  } = req.body;

  try {
    // Validate required fields
    if (!title || !description || !eventType || !startDate || !endDate || !location || !organizer?.name) {
      return HttpResponse(res, 400, true, 'Missing required fields');
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      return HttpResponse(res, 400, true, 'End date must be after start date');
    }

    // Upload image to Cloudinary if provided
    let imageUrl = null;
    if (image) {
      try {
        const uploadRes = await cloudinary.uploader.upload(image, {
          folder: 'synapse_events',
          resource_type: 'auto',
        });
        imageUrl = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Image upload failed');
      }
    }

    // Create event
    const newEvent = await Event.create({
      title,
      description,
      eventType,
      startDate: start,
      endDate: end,
      location,
      organizer,
      image: imageUrl,
      capacity: capacity || null,
      tags: tags || [],
      createdBy: userId,
    });

    // Populate creator info
    await newEvent.populate('createdBy', 'name email avatar');

    return HttpResponse(res, 201, false, 'Event created successfully', newEvent);
  } catch (error) {
    console.error('Error in CreateEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get All Events (with filters and pagination)
export const GetAllEvents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      eventType,
      status,
      search,
      tags,
      startDate,
      endDate,
    } = req.query;

    // Build filter query
    const filter = {};

    if (eventType) {
      filter.eventType = eventType;
    }

    if (status) {
      filter.status = status;
    } else {
      // By default, don't show cancelled events
      filter.status = { $ne: 'cancelled' };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'organizer.name': { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = tags.split(',').map((tag) => tag.trim());
      filter.tags = { $in: tagArray };
    }

    if (startDate || endDate) {
      filter.startDate = {};
      if (startDate) {
        filter.startDate.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.startDate.$lte = new Date(endDate);
      }
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const events = await Event.find(filter)
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar')
      .sort({ startDate: 1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count
    const total = await Event.countDocuments(filter);

    return HttpResponse(res, 200, false, 'Events fetched successfully', {
      events,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalEvents: total,
        eventsPerPage: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error in GetAllEvents:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Single Event
export const GetSingleEvent = async (req, res) => {
  const { id } = req.params;

  try {
    const event = await Event.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar email');

    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    return HttpResponse(res, 200, false, 'Event fetched successfully', event);
  } catch (error) {
    console.error('Error in GetSingleEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Update Event
export const UpdateEvent = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    // Check if user is the creator
    if (event.createdBy.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to update this event');
    }

    // Handle image upload if provided
    if (updateData.image && updateData.image.startsWith('data:image')) {
      try {
        const uploadRes = await cloudinary.uploader.upload(updateData.image, {
          folder: 'synapse_events',
          resource_type: 'auto',
        });
        updateData.image = uploadRes.secure_url;
      } catch (uploadErr) {
        console.error('Cloudinary Upload Error:', uploadErr);
        return HttpResponse(res, 500, true, 'Image upload failed');
      }
    }

    // Validate dates if updated
    if (updateData.startDate || updateData.endDate) {
      const start = new Date(updateData.startDate || event.startDate);
      const end = new Date(updateData.endDate || event.endDate);
      if (start >= end) {
        return HttpResponse(res, 400, true, 'End date must be after start date');
      }
    }

    // Update event
    const updatedEvent = await Event.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar');

    return HttpResponse(res, 200, false, 'Event updated successfully', updatedEvent);
  } catch (error) {
    console.error('Error in UpdateEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Delete Event
export const DeleteEvent = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    // Check if user is the creator
    if (event.createdBy.toString() !== userId) {
      return HttpResponse(res, 403, true, 'You are not authorized to delete this event');
    }

    // Delete event
    await Event.findByIdAndDelete(id);

    return HttpResponse(res, 200, false, 'Event deleted successfully');
  } catch (error) {
    console.error('Error in DeleteEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Register for Event
export const RegisterForEvent = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    // Check if event is cancelled
    if (event.status === 'cancelled') {
      return HttpResponse(res, 400, true, 'Cannot register for a cancelled event');
    }

    // Check if already registered
    if (event.registeredUsers.includes(userId)) {
      return HttpResponse(res, 400, true, 'You are already registered for this event');
    }

    // Check capacity
    if (event.capacity && event.registeredUsers.length >= event.capacity) {
      return HttpResponse(res, 400, true, 'Event is full');
    }

    // Add user to registered users
    event.registeredUsers.push(userId);
    await event.save();

    // Populate and return updated event
    await event.populate('createdBy', 'name email avatar');
    await event.populate('registeredUsers', 'name avatar');

    return HttpResponse(res, 200, false, 'Successfully registered for event', event);
  } catch (error) {
    console.error('Error in RegisterForEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Unregister from Event
export const UnregisterFromEvent = async (req, res) => {
  const userId = req.userId;
  const { id } = req.params;

  try {
    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    // Check if registered
    if (!event.registeredUsers.includes(userId)) {
      return HttpResponse(res, 400, true, 'You are not registered for this event');
    }

    // Remove user from registered users
    event.registeredUsers = event.registeredUsers.filter(
      (id) => id.toString() !== userId
    );
    await event.save();

    // Populate and return updated event
    await event.populate('createdBy', 'name email avatar');
    await event.populate('registeredUsers', 'name avatar');

    return HttpResponse(res, 200, false, 'Successfully unregistered from event', event);
  } catch (error) {
    console.error('Error in UnregisterFromEvent:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get Upcoming Events
export const GetUpcomingEvents = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const events = await Event.find({
      startDate: { $gte: new Date() },
      status: { $ne: 'cancelled' },
    })
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar')
      .sort({ startDate: 1 })
      .limit(parseInt(limit));

    return HttpResponse(res, 200, false, 'Upcoming events fetched successfully', events);
  } catch (error) {
    console.error('Error in GetUpcomingEvents:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get User's Registered Events
export const GetMyRegisteredEvents = async (req, res) => {
  const userId = req.userId;

  try {
    const events = await Event.find({
      registeredUsers: userId,
      status: { $ne: 'cancelled' },
    })
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar')
      .sort({ startDate: 1 });

    return HttpResponse(res, 200, false, 'Your registered events fetched successfully', events);
  } catch (error) {
    console.error('Error in GetMyRegisteredEvents:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// Get User's Created Events
export const GetMyCreatedEvents = async (req, res) => {
  const userId = req.userId;

  try {
    const events = await Event.find({ createdBy: userId })
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar')
      .sort({ createdAt: -1 });

    return HttpResponse(res, 200, false, 'Your created events fetched successfully', events);
  } catch (error) {
    console.error('Error in GetMyCreatedEvents:', error);
    return HttpResponse(res, 500, true, 'Server error', error.message);
  }
};

// AI: Generate Event with AI
export const GenerateEventWithAI = async (req, res) => {
  const userId = req.userId;
  const { title, additionalContext } = req.body;

  try {
    if (!title) {
      return HttpResponse(res, 400, true, 'Event title is required');
    }

    console.log('Generating event with AI for title:', title);

    // Construct AI prompt for event generation
    const eventPrompt = `You are a professional event organizer. Create comprehensive event details for: "${title}"

${additionalContext ? `Additional Context: ${additionalContext}` : ''}

Requirements:
1. Write an engaging, detailed event description (300-500 words)
2. Include what participants will learn or experience
3. Mention prerequisites (if any)
4. Describe the target audience
5. Include potential benefits of attending
6. Use professional, inviting tone

Also suggest:
- Event type from: workshop, seminar, extracurricular, academic, social
- Duration in hours (realistic estimate)
- Suggested capacity (number of attendees)
- 3-5 relevant tags

Return ONLY valid JSON in this format:
{
  "description": "detailed event description",
  "suggestedType": "event type",
  "suggestedDuration": number (hours),
  "suggestedCapacity": number,
  "targetAudience": "who should attend",
  "prerequisites": "what attendees should know (or 'None')",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional event planning assistant. Always return valid JSON.',
        },
        {
          role: 'user',
          content: eventPrompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_completion_tokens: 1536,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    console.log('AI event generation successful');

    return HttpResponse(res, 200, false, 'Event details generated successfully', {
      title,
      description: aiResponse.description,
      suggestedType: aiResponse.suggestedType,
      suggestedDuration: aiResponse.suggestedDuration,
      suggestedCapacity: aiResponse.suggestedCapacity,
      targetAudience: aiResponse.targetAudience,
      prerequisites: aiResponse.prerequisites,
      suggestedTags: aiResponse.suggestedTags,
    });
  } catch (error) {
    console.error('Error in GenerateEventWithAI:', error);
    return HttpResponse(res, 500, true, 'Failed to generate event with AI', error.message);
  }
};

// AI: Summarize Event
export const SummarizeEvent = async (req, res) => {
  const { id } = req.params;

  try {
    // Find event
    const event = await Event.findById(id)
      .populate('createdBy', 'name email avatar')
      .populate('registeredUsers', 'name avatar');
    
    if (!event) {
      return HttpResponse(res, 404, true, 'Event not found');
    }

    console.log('Generating summary for event:', event.title);

    // Construct AI prompt for event summarization
    const summaryPrompt = `Create a comprehensive summary of the following event that gives readers complete understanding without needing to read the full description.

Event Title: ${event.title}
Event Type: ${event.eventType}
Description:
${event.description}
Location: ${event.location}
Start Date: ${event.startDate}
End Date: ${event.endDate}
Organizer: ${event.organizer.name}
Capacity: ${event.capacity || 'Unlimited'}
Registered: ${event.registeredUsers.length} attendees

Provide:
1. A comprehensive summary (250-400 words) covering:
   - What the event is about
   - Main activities and sessions
   - Key topics or themes to be covered
   - Learning outcomes or benefits
   - Important logistical details
   - Why someone should attend
2. Key highlights (5-7 most important points about the event)
3. Specific target audience (who would benefit most)
4. What attendees will gain (4-5 concrete takeaways or outcomes)
5. Any prerequisites or requirements

Return ONLY valid JSON:
{
  "summary": "comprehensive event summary covering all important details",
  "highlights": ["highlight1", "highlight2", "highlight3", "highlight4", "highlight5"],
  "targetAudience": "detailed description of who should attend",
  "expectations": ["takeaway1", "takeaway2", "takeaway3", "takeaway4"],
  "prerequisites": "what attendees should know or bring"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a professional event summarizer. Always return valid JSON.',
        },
        {
          role: 'user',
          content: summaryPrompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_completion_tokens: 512,
      response_format: { type: 'json_object' },
    });

    const aiSummary = JSON.parse(
      completion.choices[0]?.message?.content || '{}'
    );

    console.log('Event summary generated successfully');

    return HttpResponse(res, 200, false, 'Event summary generated successfully', {
      eventId: event._id,
      title: event.title,
      eventType: event.eventType,
      summary: aiSummary.summary,
      highlights: aiSummary.highlights,
      targetAudience: aiSummary.targetAudience,
      expectations: aiSummary.expectations,
      prerequisites: aiSummary.prerequisites,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      organizer: event.organizer,
      registeredCount: event.registeredUsers.length,
      capacity: event.capacity,
    });
  } catch (error) {
    console.error('Error in SummarizeEvent:', error);
    return HttpResponse(res, 500, true, 'Failed to summarize event', error.message);
  }
};
